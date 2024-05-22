// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#pragma once

#include "driver/config/config.h"
#include "driver/task/task.h"
#include "include/open62541/types.h"

namespace opc {
/// @brief the configuration for an OPC UA connection.
struct ConnectionConfig {
    /// @brief the endpoint of the OPC UA server.
    std::string endpoint;
    /// @brief the username to use for authentication. Not required.
    std::string username;
    /// @brief the password to use for authentication. Not required.
    std::string password;

    ConnectionConfig() = default;

    explicit ConnectionConfig(
        config::Parser parser
    ): endpoint(parser.required<std::string>("endpoint")),
       username(parser.optional<std::string>("username", "")),
       password(parser.optional<std::string>("password", "")) {
    }

    json toJSON() const {
        return {
            {"endpoint", endpoint},
            {"username", username},
            {"password", password}
        };
    }
};

struct DeviceNodeProperties {
    synnax::DataType data_type;
    std::string name;
    std::string node_id;

    DeviceNodeProperties(
        synnax::DataType data_type,
        std::string name,
        std::string node_id
    ): data_type(data_type), name(name), node_id(node_id) {
    }

    explicit DeviceNodeProperties(config::Parser parser): data_type(
            synnax::DataType(parser.required<std::string>("data_type"))),
        name(parser.required<std::string>("name")),
        node_id(parser.required<std::string>("node_id")) {
    }

    json toJSON() const {
        return {
            {"data_type", data_type.name()},
            {"name", name},
            {"node_id", node_id},
        };
    }
};

struct DeviceProperties {
    ConnectionConfig connection;
    std::vector<DeviceNodeProperties> channels;

    DeviceProperties(
        ConnectionConfig connection,
        std::vector<DeviceNodeProperties> channels
    ): connection(connection), channels(channels) {
    }

    explicit DeviceProperties(
        config::Parser parser
    ): connection(parser.child("connection")),
       channels({}) {
        parser.iter("channels", [&](const config::Parser &cb) {
            channels.emplace_back(cb);
        });
    }

    json toJSON() const {
        json j;
        j["connection"] = connection.toJSON();
        j["channels"] = json::array();
        for (const auto &ch: channels)
            j["channels"].push_back(ch.toJSON());
        return j;
    }
};

const std::string INTEGRATION_NAME = "opc";

class Factory final : public task::Factory {
    std::pair<std::unique_ptr<task::Task>, bool> configureTask(
        const std::shared_ptr<task::Context> &ctx,
        const synnax::Task &task
    ) override;

    std::vector<std::pair<synnax::Task, std::unique_ptr<task::Task> > >
    configureInitialTasks(const std::shared_ptr<task::Context> &ctx,
                          const synnax::Rack &rack) override;
};
}