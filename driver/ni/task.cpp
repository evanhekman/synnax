// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

//
// Created by Synnax on 2/18/2024.
//

#include "ni.h"
#include <cassert>
#include <stdio.h>

///////////////////////////////////////////////////////////////////////////////////
//                                    ScannerTask                                //
///////////////////////////////////////////////////////////////////////////////////

ni::ScannerTask::ScannerTask(
        const std::shared_ptr <task::Context> &ctx,
        synnax::Task task
) : scanner(ctx, task), ctx(ctx), task(task), running(true){
    //begin scanning on construction
    // LOG(INFO) << "[NI Task] constructing scanner task " << this->task.name;
    // thread = std::thread(&ni::ScannerTask::run, this);
}

std::unique_ptr <task::Task> ni::ScannerTask::configure(
        const std::shared_ptr <task::Context> &ctx,
        const synnax::Task &task
) {
    return std::make_unique<ni::ScannerTask>(ctx, task);
}

void ni::ScannerTask::start() {
    LOG(INFO) << "[NI Task] start function of scanner task " << this->task.name;
    this->running = true;
    // this->thread = std::thread(&ni::ScannerTask::run, this);
}

void ni::ScannerTask::stop() {
    this->running = false;
    this->thread.join();
    LOG(INFO) << "[NI Task] stopped scanner task " << this->task.name;
}


void ni::ScannerTask::exec(task::Command &cmd) {
    if (cmd.type == "scan") {
        scanner.scan();
        scanner.createDevices();
        if (!scanner.ok()) {
            ctx->setState({
                                  .task = task.key,
                                  .variant = "error",
                                  .details = {"message", "failed to scan"}
                          });
            LOG(ERROR) << "[NI Task] failed to scan for task " << this->task.name;
        } //else {
        //    auto devices = scanner.getDevices(); // TODO remove and dont send in details
        //     ctx->setState({
        //                           .task = task.key,
        //                           .variant = "success",
        //                           .details = {
        //                                   {"devices", devices.dump(4)}
        //                           }
        //                   });
        //     LOG(INFO) << "[NI Task] successfully scanned for task " << this->task.name;
        // }
    } else if (cmd.type == "stop"){
        this->stop();
    }else {
        LOG(ERROR) << "unknown command type: " << cmd.type;
    }
}

void ni::ScannerTask::run(){
    // LOG(INFO) << "[NI Task] Scanner task running " << this->task.name;
    auto scan_cmd = task::Command{task.key, "scan", {}};

    // perform a scan
    while(true){
        std::this_thread::sleep_for(std::chrono::seconds(5));
        if(this->running){
            this->exec(scan_cmd);
        } else{
            break;
        }
    }
}


bool ni::ScannerTask::ok() {
    return this->ok_state;
}

ni::ScannerTask::~ScannerTask(){
    LOG(INFO) << "[NI Task] destructing scanner task " << this->task.name;
}
///////////////////////////////////////////////////////////////////////////////////
//                                    ReaderTask                                 //
///////////////////////////////////////////////////////////////////////////////////

ni::ReaderTask::ReaderTask(const std::shared_ptr <task::Context> &ctx,
                           synnax::Task task) :task(task), ctx(ctx){

    // create a breaker config TODO: use the task to generate the other parameters?
    auto breaker_config = breaker::Config{
            .name = task.name,
            .base_interval = 1 * SECOND,
            .max_retries = 20,
            .scale = 1.2,
    };

    // create a daq reader to provide to cmd read pipe as sink
    ni::NiDAQmxInterface::CreateTask("", &this->task_handle);

    // log task config
    LOG(INFO) << "[NI Task] task config: " << task.config;

    // determine whether DigitalReadSource or AnalogReadSource is needed
    std::unique_ptr<pipeline::Source> daq_reader;
    std::vector <synnax::ChannelKey> channel_keys;
    if(task.type == "ni_digital_read"){
        auto digital_reader = std::make_unique<ni::DigitalReadSource>(this->task_handle, ctx, task);
        digital_reader->init();
        channel_keys = digital_reader->getChannelKeys();
        daq_reader = std::move(digital_reader);
    } else{
        auto analog_reader = std::make_unique<ni::AnalogReadSource>(this->task_handle, ctx, task);
        analog_reader->init();
        channel_keys = analog_reader->getChannelKeys();
        daq_reader = std::move(analog_reader);
    }


    // TODO: bring this check again
    
    // if (!daq_reader->ok()) {
    //     LOG(ERROR) << "[NI Reader] failed to construct reader for " << task.name;
    //     this->ok_state = false;
    //     return;
    // }

    // construct writer config

    auto writer_config = synnax::WriterConfig{
            .channels = channel_keys,
            .start = synnax::TimeStamp::now(),
            .enable_auto_commit = true
    };

    // construct acquisition pipe
    this->daq_read_pipe = pipeline::Acquisition(ctx,
                                                writer_config,
                                                std::move(daq_reader),
                                                breaker_config);
    ctx->setState({
            .task = task.key,
            .variant = "success",
            .details = {
                    {"running", false}
            }
    });
}


std::unique_ptr <task::Task> ni::ReaderTask::configure(const std::shared_ptr <task::Context> &ctx,
                                                       const synnax::Task &task) {
    LOG(INFO) << "[NI Task] configuring task " << task.name;    
    return std::make_unique<ni::ReaderTask>(ctx, task);
}

void ni::ReaderTask::exec(task::Command &cmd) {
    if (cmd.type == "start") {
        LOG(INFO) << "[NI Task] started reader task " << this->task.name;
        this->start();
    } else if (cmd.type == "stop") {
        LOG(INFO) << "[NI Task] stopped reader task " << this->task.name;
       this->stop();
    } else {
        LOG(ERROR) << "unknown command type: " << cmd.type;
    }
}


void ni::ReaderTask::stop(){
     if(!this->running.exchange(false) || !this->ok()){
        LOG(INFO) << "[NI Task] did not stop " << this->task.name << " running: " << this->running << " ok: " << this->ok();
        return;
    }
    daq_read_pipe.stop();
    ctx->setState({
                            .task = task.key,
                            .variant = "success",
                            .details = {
                                    {"running", false}
                            }
                    });
    LOG(INFO) << "[NI Task] successfully stopped task " << this->task.name;
}

void ni::ReaderTask::start(){
    if(this->running.exchange(true)|| !this->ok()){
            LOG(INFO) << "[NI Task] did not start " << this->task.name << " as it is not running or in error state";
        return;
    }
    daq_read_pipe.start();
    ctx->setState({
                            .task = task.key,
                            .variant = "success",
                            .details = {
                                    {"running", true}
                            }
                    });
    LOG(INFO) << "[NI Task] successfully started task " << this->task.name;
}


bool ni::ReaderTask::ok() {
    return this->ok_state;
}

///////////////////////////////////////////////////////////////////////////////////
//                                    WriterTask                                 //
///////////////////////////////////////////////////////////////////////////////////

ni::WriterTask::WriterTask(const std::shared_ptr <task::Context> &ctx,
                           synnax::Task task) {
    this->task = task;
    this->ctx = ctx;
    // create a breaker config TODO: use the task to generate the other parameters?
    auto breaker_config = breaker::Config{
            .name = task.name,
            .base_interval = 1 * SECOND,
            .max_retries = 20,
            .scale = 1.2,
    };

    // create a daq reader to provide to cmd read pipe as sink
    ni::NiDAQmxInterface::CreateTask("", &this->task_handle);
    auto daq_writer = std::make_unique<ni::DigitalWriteSink>(this->task_handle, ctx, task);
    if (!daq_writer->ok()) {
        LOG(ERROR) << "[NI Writer] failed to construct reader for" << task.name;
        this->ok_state = false;
        return;
    }

    // construct writer config
    std::vector <synnax::ChannelKey> cmd_keys = daq_writer->getCmdChannelKeys();
    std::vector <synnax::ChannelKey> state_keys = daq_writer->getStateChannelKeys();

    // create a writer config to write state channels
    auto writer_config = synnax::WriterConfig{
            .channels = state_keys,
            .start = synnax::TimeStamp::now(),
            .enable_auto_commit = true,
    };

    // create a streamer config to stream incoming cmds
    auto streamer_config = synnax::StreamerConfig{
            .channels = cmd_keys,
            .start = synnax::TimeStamp::now(),
    };

    // construct acquisition pipe
    this->state_write_pipe = pipeline::Acquisition(ctx,
                                                   writer_config,
                                                   daq_writer->writer_state_source,
                                                   breaker_config);

    // construct control pipe
    this->cmd_write_pipe = std::move(pipeline::Control(ctx,
                                                       streamer_config,
                                                       std::move(daq_writer),
                                                       breaker_config));

    ctx->setState({
        .task = task.key,
        .variant = "success",
        .details = {
                {"running", false}
        }
    });
}


std::unique_ptr <task::Task> ni::WriterTask::configure(const std::shared_ptr <task::Context> &ctx,
                                                       const synnax::Task &task) {
    return std::make_unique<ni::WriterTask>(ctx, task);
}

void ni::WriterTask::exec(task::Command &cmd) {
    if (cmd.type == "start") {
        this->start();
    } else if (cmd.type == "stop") {
        this->stop();
    } else {
        LOG(ERROR) << "unknown command type: " << cmd.type;
    }
}


void ni::WriterTask::stop(){
    if(!this->running.exchange(false) || !this->ok()){
        return; // TODO: handle this error
    }
    this->state_write_pipe.stop();
    this->cmd_write_pipe.stop();

    ctx->setState({
                            .task = task.key,
                            .variant = "success",
                            .details = {
                                    {"running", false}
                            }
                    });
    LOG(INFO) << "[NI Task] successfully stopped task " << this->task.name;
}


void ni::WriterTask::start(){
    if(this->running.exchange(true) || !this->ok()){
        return;
    }
    this->cmd_write_pipe.start();
    this->state_write_pipe.start();

    ctx->setState({
                        .task = task.key,
                        .variant = "success",
                        .details = {
                                {"running", true}
                        }
                    });
    LOG(INFO) << "[NI Task] successfully started task " << this->task.name;
}



bool ni::WriterTask::ok() {
    return this->ok_state;
}