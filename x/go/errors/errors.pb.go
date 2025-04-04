// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.36.6
// 	protoc        (unknown)
// source: x/go/errors/errors.proto

package errors

import (
	protoreflect "google.golang.org/protobuf/reflect/protoreflect"
	protoimpl "google.golang.org/protobuf/runtime/protoimpl"
	reflect "reflect"
	sync "sync"
	unsafe "unsafe"
)

const (
	// Verify that this generated code is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(20 - protoimpl.MinVersion)
	// Verify that runtime/protoimpl is sufficiently up-to-date.
	_ = protoimpl.EnforceVersion(protoimpl.MaxVersion - 20)
)

type PBPayload struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Type          string                 `protobuf:"bytes,1,opt,name=Type,proto3" json:"Type,omitempty"`
	Data          string                 `protobuf:"bytes,2,opt,name=Data,proto3" json:"Data,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *PBPayload) Reset() {
	*x = PBPayload{}
	mi := &file_x_go_errors_errors_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *PBPayload) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*PBPayload) ProtoMessage() {}

func (x *PBPayload) ProtoReflect() protoreflect.Message {
	mi := &file_x_go_errors_errors_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use PBPayload.ProtoReflect.Descriptor instead.
func (*PBPayload) Descriptor() ([]byte, []int) {
	return file_x_go_errors_errors_proto_rawDescGZIP(), []int{0}
}

func (x *PBPayload) GetType() string {
	if x != nil {
		return x.Type
	}
	return ""
}

func (x *PBPayload) GetData() string {
	if x != nil {
		return x.Data
	}
	return ""
}

var File_x_go_errors_errors_proto protoreflect.FileDescriptor

const file_x_go_errors_errors_proto_rawDesc = "" +
	"\n" +
	"\x18x/go/errors/errors.proto\x12\x06errors\"3\n" +
	"\tPBPayload\x12\x12\n" +
	"\x04Type\x18\x01 \x01(\tR\x04Type\x12\x12\n" +
	"\x04Data\x18\x02 \x01(\tR\x04DataBq\n" +
	"\n" +
	"com.errorsB\vErrorsProtoP\x01Z\x1egithub.com/synnaxlabs/x/errors\xa2\x02\x03EXX\xaa\x02\x06Errors\xca\x02\x06Errors\xe2\x02\x12Errors\\GPBMetadata\xea\x02\x06Errorsb\x06proto3"

var (
	file_x_go_errors_errors_proto_rawDescOnce sync.Once
	file_x_go_errors_errors_proto_rawDescData []byte
)

func file_x_go_errors_errors_proto_rawDescGZIP() []byte {
	file_x_go_errors_errors_proto_rawDescOnce.Do(func() {
		file_x_go_errors_errors_proto_rawDescData = protoimpl.X.CompressGZIP(unsafe.Slice(unsafe.StringData(file_x_go_errors_errors_proto_rawDesc), len(file_x_go_errors_errors_proto_rawDesc)))
	})
	return file_x_go_errors_errors_proto_rawDescData
}

var file_x_go_errors_errors_proto_msgTypes = make([]protoimpl.MessageInfo, 1)
var file_x_go_errors_errors_proto_goTypes = []any{
	(*PBPayload)(nil), // 0: errors.PBPayload
}
var file_x_go_errors_errors_proto_depIdxs = []int32{
	0, // [0:0] is the sub-list for method output_type
	0, // [0:0] is the sub-list for method input_type
	0, // [0:0] is the sub-list for extension type_name
	0, // [0:0] is the sub-list for extension extendee
	0, // [0:0] is the sub-list for field type_name
}

func init() { file_x_go_errors_errors_proto_init() }
func file_x_go_errors_errors_proto_init() {
	if File_x_go_errors_errors_proto != nil {
		return
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: unsafe.Slice(unsafe.StringData(file_x_go_errors_errors_proto_rawDesc), len(file_x_go_errors_errors_proto_rawDesc)),
			NumEnums:      0,
			NumMessages:   1,
			NumExtensions: 0,
			NumServices:   0,
		},
		GoTypes:           file_x_go_errors_errors_proto_goTypes,
		DependencyIndexes: file_x_go_errors_errors_proto_depIdxs,
		MessageInfos:      file_x_go_errors_errors_proto_msgTypes,
	}.Build()
	File_x_go_errors_errors_proto = out.File
	file_x_go_errors_errors_proto_goTypes = nil
	file_x_go_errors_errors_proto_depIdxs = nil
}
