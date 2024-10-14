// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.
#pragma once

#include <string>
#include <vector>
#include <map>
#include <thread>
#include <stdio.h>

#include "LJM_Utilities.h"

#include "nlohmann/json.hpp"

#include "client/cpp/synnax.h"

#include "driver/errors/errors.h"
#include "driver/task/task.h"
#include "driver/pipeline/acquisition.h"


namespace labjack{

    struct ReaderChannelConfig {
        std::string location;
        bool enabled = true;
        synnax::DataType data_type;
        uint32_t channel_key;
        double range = 10.0;
        std::string channel_types = "";

        ReaderChannelConfig() = default;

        explicit ReaderChannelConfig(config::Parser &parser)
                : location(parser.required<std::string>("location")),
                  enabled(parser.optional<bool>("enabled", true)),
                  data_type(parser.required<std::string>("data_type")),
                  channel_key(parser.required<uint32_t>("channel_key")),
                  range(parser.optional<double>("range", 10.0)),
                  channel_types(parser.optional<std::string>("channel_types", "")) {
        }
    };

    struct ReaderConfig {
        std::string device_type;
        std::string device_key;
        std::vector<ReaderChannelConfig> channels;
        synnax::Rate sample_rate = synnax::Rate(1); // TODO: change default?
        synnax::Rate stream_rate = synnax::Rate(1); // TODO: change default?
        std::string task_name;
        synnax::ChannelKey task_key;
        std::set<uint32_t> index_keys;
        std::string serial_number; // used to open devices
        std::string connection_type; // used to open devices
        std::map<std::string, uint32_t> channel_map; // move this into class instead of reader config
        int num_index = 0; // TODO: remove this isn't being used?
        int num_channels = 0; // TODO: remove this isn't being used?
        bool data_saving;

        ReaderConfig() = default;

        explicit ReaderConfig(config::Parser &parser)
                : device_type(parser.required<std::string>("device_type")),
                  device_key(parser.required<std::string>("device_key")),
                  sample_rate(synnax::Rate(parser.optional<int>("sample_rate", 1))),
                  stream_rate(synnax::Rate(parser.optional<int>("stream_rate", 1))),
                  index_keys(parser.optional<std::set<uint32_t>>("index_keys", {})),
                  serial_number(parser.optional<std::string>("serial_number", "")),
                  connection_type(parser.optional<std::string>("connection_type", "")),
                  data_saving(parser.optional<bool>("data_saving", false)) {

            // Parse the channels
            parser.iter("channels", [this](config::Parser &channel_parser) {
                channels.emplace_back(ReaderChannelConfig(channel_parser));
                this->channel_map[channels.back().location] = channels.back().channel_key;
            });
        }
    };

///////////////////////////////////////////////////////////////////////////////////
//                                   Source                                      //
///////////////////////////////////////////////////////////////////////////////////
class Source : public pipeline::Source{
public:
    explicit Source (
            int handle,
            const std::shared_ptr<task::Context> &ctx,
            const synnax::Task task,
            const ReaderConfig &reader_config
        ) : handle(handle),
            ctx(ctx),
            task(task),
            reader_config(reader_config) {
        LOG(INFO) << "creating labjack source";
        this->init();
    }

    // destructor
    ~Source();

    std::vector<synnax::ChannelKey> get_channel_keys();

    void stopped_with_err(const freighter::Error &err);

    std::pair<Frame, freighter::Error> read(breaker::Breaker &breaker);

    void init();

    void write_to_series(
            synnax::Series &series,
            double &data,
            synnax::DataType data_type
        );

private:

    int handle;
    ReaderConfig reader_config;
    std::shared_ptr<task::Context> ctx;
    breaker::Breaker breaker;
    synnax::Task task;
};
}