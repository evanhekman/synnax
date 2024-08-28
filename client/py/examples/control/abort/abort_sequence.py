#  Copyright 2024 Synnax Labs, Inc.
#
#  Use of this software is governed by the Business Source License included in the file
#  licenses/BSL.txt.
#
#  As of the Change Date specified in that file, in accordance with the Business Source
#  License, use of this software will be governed by the Apache License, Version 2.0,
#  included in the file licenses/APL.txt.

import synnax as sy
import time

# We've logged in via the CLI, so there's no need to provide credentials here. See
# https://docs.synnaxlabs.com/reference/python-client/get-started for more information.
client = sy.Synnax()

# Define the control channel names
PRESS_VALVE = "press_vlv_cmd"
VENT_VALVE = "vent_vlv_cmd"
PRESSURE = "pressure"

# Open a control sequence under a context manager, so that the control is released when
# the block exits
with client.control.acquire(
    name="Abort Sequence",
    # Defines the authority the control sequence has by default over the channels.
    # A value of 100 is lower than the default value of 200 in the nominal sequence
    # i.e. until the abort condition is met, the nominal sequence will have control.
    write_authorities=[100],
    write=[PRESS_VALVE, VENT_VALVE],
    read=[PRESSURE],
) as controller:
    # Wait until we hit an abort condition.
    controller.wait_until(lambda c: c[PRESSURE] > 30)
    # Change the control authority to the highest level - 1. This is higher than
    # the 200 value in the nominal sequence, so the abort sequence will take control.
    controller.set_authority({PRESS_VALVE: 254, VENT_VALVE: 254})
    # Vent the system
    controller.set({PRESS_VALVE: False, VENT_VALVE: True})
    # Hold control until the user presses Ctrl+C
    time.sleep(1e6)