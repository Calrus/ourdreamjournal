// Code generated by protoc-gen-go. DO NOT EDIT.
// versions:
// 	protoc-gen-go v1.36.6
// 	protoc        v6.31.0
// source: dream_journal.proto

package proto

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

// Dream represents a single dream entry in the journal
type Dream struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Id            string                 `protobuf:"bytes,1,opt,name=id,proto3" json:"id,omitempty"`
	UserId        string                 `protobuf:"bytes,2,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Text          string                 `protobuf:"bytes,3,opt,name=text,proto3" json:"text,omitempty"`
	Timestamp     int64                  `protobuf:"varint,4,opt,name=timestamp,proto3" json:"timestamp,omitempty"` // Unix timestamp
	Public        bool                   `protobuf:"varint,5,opt,name=public,proto3" json:"public,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *Dream) Reset() {
	*x = Dream{}
	mi := &file_dream_journal_proto_msgTypes[0]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *Dream) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*Dream) ProtoMessage() {}

func (x *Dream) ProtoReflect() protoreflect.Message {
	mi := &file_dream_journal_proto_msgTypes[0]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use Dream.ProtoReflect.Descriptor instead.
func (*Dream) Descriptor() ([]byte, []int) {
	return file_dream_journal_proto_rawDescGZIP(), []int{0}
}

func (x *Dream) GetId() string {
	if x != nil {
		return x.Id
	}
	return ""
}

func (x *Dream) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

func (x *Dream) GetText() string {
	if x != nil {
		return x.Text
	}
	return ""
}

func (x *Dream) GetTimestamp() int64 {
	if x != nil {
		return x.Timestamp
	}
	return 0
}

func (x *Dream) GetPublic() bool {
	if x != nil {
		return x.Public
	}
	return false
}

// DreamRequest is used to create a new dream entry
type DreamRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	UserId        string                 `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	Text          string                 `protobuf:"bytes,2,opt,name=text,proto3" json:"text,omitempty"`
	Public        bool                   `protobuf:"varint,3,opt,name=public,proto3" json:"public,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *DreamRequest) Reset() {
	*x = DreamRequest{}
	mi := &file_dream_journal_proto_msgTypes[1]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *DreamRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DreamRequest) ProtoMessage() {}

func (x *DreamRequest) ProtoReflect() protoreflect.Message {
	mi := &file_dream_journal_proto_msgTypes[1]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DreamRequest.ProtoReflect.Descriptor instead.
func (*DreamRequest) Descriptor() ([]byte, []int) {
	return file_dream_journal_proto_rawDescGZIP(), []int{1}
}

func (x *DreamRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

func (x *DreamRequest) GetText() string {
	if x != nil {
		return x.Text
	}
	return ""
}

func (x *DreamRequest) GetPublic() bool {
	if x != nil {
		return x.Public
	}
	return false
}

// DreamResponse is returned after creating a dream
type DreamResponse struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	Dream         *Dream                 `protobuf:"bytes,1,opt,name=dream,proto3" json:"dream,omitempty"`
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *DreamResponse) Reset() {
	*x = DreamResponse{}
	mi := &file_dream_journal_proto_msgTypes[2]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *DreamResponse) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*DreamResponse) ProtoMessage() {}

func (x *DreamResponse) ProtoReflect() protoreflect.Message {
	mi := &file_dream_journal_proto_msgTypes[2]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use DreamResponse.ProtoReflect.Descriptor instead.
func (*DreamResponse) Descriptor() ([]byte, []int) {
	return file_dream_journal_proto_rawDescGZIP(), []int{2}
}

func (x *DreamResponse) GetDream() *Dream {
	if x != nil {
		return x.Dream
	}
	return nil
}

// ListRequest is used to fetch dreams
type ListRequest struct {
	state         protoimpl.MessageState `protogen:"open.v1"`
	UserId        string                 `protobuf:"bytes,1,opt,name=user_id,json=userId,proto3" json:"user_id,omitempty"`
	IncludePublic bool                   `protobuf:"varint,2,opt,name=include_public,json=includePublic,proto3" json:"include_public,omitempty"` // Whether to include public dreams from other users
	unknownFields protoimpl.UnknownFields
	sizeCache     protoimpl.SizeCache
}

func (x *ListRequest) Reset() {
	*x = ListRequest{}
	mi := &file_dream_journal_proto_msgTypes[3]
	ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
	ms.StoreMessageInfo(mi)
}

func (x *ListRequest) String() string {
	return protoimpl.X.MessageStringOf(x)
}

func (*ListRequest) ProtoMessage() {}

func (x *ListRequest) ProtoReflect() protoreflect.Message {
	mi := &file_dream_journal_proto_msgTypes[3]
	if x != nil {
		ms := protoimpl.X.MessageStateOf(protoimpl.Pointer(x))
		if ms.LoadMessageInfo() == nil {
			ms.StoreMessageInfo(mi)
		}
		return ms
	}
	return mi.MessageOf(x)
}

// Deprecated: Use ListRequest.ProtoReflect.Descriptor instead.
func (*ListRequest) Descriptor() ([]byte, []int) {
	return file_dream_journal_proto_rawDescGZIP(), []int{3}
}

func (x *ListRequest) GetUserId() string {
	if x != nil {
		return x.UserId
	}
	return ""
}

func (x *ListRequest) GetIncludePublic() bool {
	if x != nil {
		return x.IncludePublic
	}
	return false
}

var File_dream_journal_proto protoreflect.FileDescriptor

const file_dream_journal_proto_rawDesc = "" +
	"\n" +
	"\x13dream_journal.proto\x12\fdreamjournal\"z\n" +
	"\x05Dream\x12\x0e\n" +
	"\x02id\x18\x01 \x01(\tR\x02id\x12\x17\n" +
	"\auser_id\x18\x02 \x01(\tR\x06userId\x12\x12\n" +
	"\x04text\x18\x03 \x01(\tR\x04text\x12\x1c\n" +
	"\ttimestamp\x18\x04 \x01(\x03R\ttimestamp\x12\x16\n" +
	"\x06public\x18\x05 \x01(\bR\x06public\"S\n" +
	"\fDreamRequest\x12\x17\n" +
	"\auser_id\x18\x01 \x01(\tR\x06userId\x12\x12\n" +
	"\x04text\x18\x02 \x01(\tR\x04text\x12\x16\n" +
	"\x06public\x18\x03 \x01(\bR\x06public\":\n" +
	"\rDreamResponse\x12)\n" +
	"\x05dream\x18\x01 \x01(\v2\x13.dreamjournal.DreamR\x05dream\"M\n" +
	"\vListRequest\x12\x17\n" +
	"\auser_id\x18\x01 \x01(\tR\x06userId\x12%\n" +
	"\x0einclude_public\x18\x02 \x01(\bR\rincludePublic2\x9a\x01\n" +
	"\fDreamJournal\x12H\n" +
	"\vCreateDream\x12\x1a.dreamjournal.DreamRequest\x1a\x1b.dreamjournal.DreamResponse\"\x00\x12@\n" +
	"\n" +
	"ListDreams\x12\x19.dreamjournal.ListRequest\x1a\x13.dreamjournal.Dream\"\x000\x01B\x0fZ\rbackend/protob\x06proto3"

var (
	file_dream_journal_proto_rawDescOnce sync.Once
	file_dream_journal_proto_rawDescData []byte
)

func file_dream_journal_proto_rawDescGZIP() []byte {
	file_dream_journal_proto_rawDescOnce.Do(func() {
		file_dream_journal_proto_rawDescData = protoimpl.X.CompressGZIP(unsafe.Slice(unsafe.StringData(file_dream_journal_proto_rawDesc), len(file_dream_journal_proto_rawDesc)))
	})
	return file_dream_journal_proto_rawDescData
}

var file_dream_journal_proto_msgTypes = make([]protoimpl.MessageInfo, 4)
var file_dream_journal_proto_goTypes = []any{
	(*Dream)(nil),         // 0: dreamjournal.Dream
	(*DreamRequest)(nil),  // 1: dreamjournal.DreamRequest
	(*DreamResponse)(nil), // 2: dreamjournal.DreamResponse
	(*ListRequest)(nil),   // 3: dreamjournal.ListRequest
}
var file_dream_journal_proto_depIdxs = []int32{
	0, // 0: dreamjournal.DreamResponse.dream:type_name -> dreamjournal.Dream
	1, // 1: dreamjournal.DreamJournal.CreateDream:input_type -> dreamjournal.DreamRequest
	3, // 2: dreamjournal.DreamJournal.ListDreams:input_type -> dreamjournal.ListRequest
	2, // 3: dreamjournal.DreamJournal.CreateDream:output_type -> dreamjournal.DreamResponse
	0, // 4: dreamjournal.DreamJournal.ListDreams:output_type -> dreamjournal.Dream
	3, // [3:5] is the sub-list for method output_type
	1, // [1:3] is the sub-list for method input_type
	1, // [1:1] is the sub-list for extension type_name
	1, // [1:1] is the sub-list for extension extendee
	0, // [0:1] is the sub-list for field type_name
}

func init() { file_dream_journal_proto_init() }
func file_dream_journal_proto_init() {
	if File_dream_journal_proto != nil {
		return
	}
	type x struct{}
	out := protoimpl.TypeBuilder{
		File: protoimpl.DescBuilder{
			GoPackagePath: reflect.TypeOf(x{}).PkgPath(),
			RawDescriptor: unsafe.Slice(unsafe.StringData(file_dream_journal_proto_rawDesc), len(file_dream_journal_proto_rawDesc)),
			NumEnums:      0,
			NumMessages:   4,
			NumExtensions: 0,
			NumServices:   1,
		},
		GoTypes:           file_dream_journal_proto_goTypes,
		DependencyIndexes: file_dream_journal_proto_depIdxs,
		MessageInfos:      file_dream_journal_proto_msgTypes,
	}.Build()
	File_dream_journal_proto = out.File
	file_dream_journal_proto_goTypes = nil
	file_dream_journal_proto_depIdxs = nil
}
