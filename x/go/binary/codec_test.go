// Copyright 2023 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

package binary_test

import (
	"bytes"
	. "github.com/onsi/ginkgo/v2"
	. "github.com/onsi/gomega"
	"github.com/synnaxlabs/x/binary"
)

type toEncode struct {
	Value int
}

var _ = Describe("Codec", func() {
	DescribeTable("Encode + Decode", func(ecd binary.Codec) {
		b, err := ecd.Encode(nil, toEncode{1})
		Expect(err).ToNot(HaveOccurred())
		var d toEncode
		Expect(ecd.Decode(ctx, b, &d)).To(Succeed())
		Expect(d.Value).To(Equal(1))
		var d2 toEncode
		Expect(ecd.DecodeStream(nil, bytes.NewReader(b), &d2)).To(Succeed())
		Expect(d2.Value).To(Equal(1))
	},
		Entry("Gob", &binary.GobEncoderDecoder{}),
		Entry("JSON", &binary.JSONEncoderDecoder{}),
		Entry("MsgPack", &binary.MsgPackEncoderDecoder{}),
		Entry("PassThrough", &binary.PassThroughEncoderDecoder{Codec: &binary.GobEncoderDecoder{}}),
	)
	Describe("PassThrough encoding and decoding", func() {
		It("Should pass through the encoding and decoding when a byte slice is provided", func() {
			ecd := &binary.PassThroughEncoderDecoder{Codec: &binary.GobEncoderDecoder{}}
			b, err := ecd.Encode(nil, []byte{1, 2, 3})
			Expect(err).ToNot(HaveOccurred())
			Expect(b).To(Equal([]byte{1, 2, 3}))
			var d []byte
			Expect(ecd.Decode(nil, b, &d)).To(Succeed())
			Expect(d).To(Equal([]byte{1, 2, 3}))
		})
	})
	Describe("Additional Error Info", func() {
		DescribeTable("Standard Type", func(ecd binary.Codec) {
			codec := &binary.MsgPackEncoderDecoder{}
			_, err := codec.Encode(nil, make(chan int))
			Expect(err).To(HaveOccurred())
			msg := err.Error()
			Expect(msg).To(ContainSubstring("failed to encode value"))
			Expect(msg).To(ContainSubstring("kind=chan, type=chan int"))
		},
			Entry("Gob", &binary.GobEncoderDecoder{}),
			Entry("JSON", &binary.JSONEncoderDecoder{}),
			Entry("MsgPack", &binary.MsgPackEncoderDecoder{}),
		)
		DescribeTable("Custom Type", func(ecd binary.Codec) {
			type custom struct {
				Value int
				Chan  chan int
			}
			codec := &binary.MsgPackEncoderDecoder{}
			_, err := codec.Encode(nil, custom{Chan: make(chan int)})
			Expect(err).To(HaveOccurred())
			msg := err.Error()
			Expect(msg).To(ContainSubstring("failed to encode value"))
			Expect(msg).To(ContainSubstring("kind=struct, type=binary_test.custom"))
		},
			Entry("Gob", &binary.GobEncoderDecoder{}),
			Entry("JSON", &binary.JSONEncoderDecoder{}),
			Entry("MsgPack", &binary.MsgPackEncoderDecoder{}),
		)
	})
})