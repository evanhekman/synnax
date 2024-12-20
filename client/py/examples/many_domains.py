#  Copyright 2024 Synnax Labs, Inc.
#
#  Use of this software is governed by the Business Source License included in the file
#  licenses/BSL.txt.
#
#  As of the Change Date specified in that file, in accordance with the Business Source
#  License, use of this software will be governed by the Apache License, Version 2.0,
#  included in the file licenses/APL.txt.

import synnax as sy
import numpy as np

client = sy.Synnax()

time_ch = client.channels.create(
    name="time",
    data_type="timestamp",
    is_index=True,
    retrieve_if_name_exists=True,
)

data_ch = client.channels.create(
    name="data",
    data_type="float32",
    index=time_ch.key,
    retrieve_if_name_exists=True,
)

start = sy.TimeStamp.now()
count = int(100)

data = np.sin(np.linspace(0, 2 * np.pi, count))

for i in range(100):
    # Every write, we will write 100 sample points over 1 second.
    stamps = np.linspace(start, start + 1 * sy.TimeSpan.SECOND, count, dtype=np.int64)
    time_ch.write(
        start=start,
        data=stamps,
    )
    data_ch.write(
        start=start,
        data=data,
    )

    # The next domain starts 2 seconds after the previous one finishes.
    start = start + 2 * sy.TimeSpan.SECOND

# We can read all the domains together. Note that since we are only passing in one channel
# to read, we have a resulting series for data in this particular channel, instead of a frame
# for data in many channels.
series = client.read(sy.TimeRange.MAX, data_ch.key)
print("samples read:", len(series))
