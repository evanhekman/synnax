// Copyright 2024 Synnax Labs, Inc.
//
// Use of this software is governed by the Business Source License included in the file
// licenses/BSL.txt.
//
// As of the Change Date specified in that file, in accordance with the Business Source
// License, use of this software will be governed by the Apache License, Version 2.0,
// included in the file licenses/APL.txt.

#include <open62541/client_config_default.h>
#include <open62541/client_highlevel.h>
#include <open62541/client_subscriptions.h>
#include <open62541/plugin/log_stdout.h>

#include <stdlib.h>
#include <stdio.h>

#ifdef UA_ENABLE_SUBSCRIPTIONS
static void
handler_TheAnswerChanged(UA_Client *client, UA_UInt32 subId, void *subContext,
                         UA_UInt32 monId, void *monContext, UA_DataValue *value) {
    printf("The Answer has changed!\n");
}
#endif

static UA_StatusCode
nodeIter(UA_NodeId childId, UA_Boolean isInverse, UA_NodeId referenceTypeId, void *handle) {
    if(isInverse)
        return UA_STATUSCODE_GOOD;
    UA_NodeId *parent = (UA_NodeId *)handle;
    printf("%u, %u --- %u ---> NodeId %u, %u\n",
           parent->namespaceIndex, parent->identifier.numeric,
           referenceTypeId.identifier.numeric, childId.namespaceIndex,
           childId.identifier.numeric);
    return UA_STATUSCODE_GOOD;
}

int main(int argc, char *argv[]) {
    UA_Client *client = UA_Client_new();
    UA_ClientConfig_setDefault(UA_Client_getConfig(client));

    /* Listing endpoints */
    UA_EndpointDescription* endpointArray = NULL;
    size_t endpointArraySize = 0;
    UA_StatusCode retval = UA_Client_getEndpoints(client, "opc.tcp://localhost:4840",
                                                  &endpointArraySize, &endpointArray);
    if(retval != UA_STATUSCODE_GOOD) {
        printf("Could not get the endpoints\n");
        UA_Array_delete(endpointArray, endpointArraySize, &UA_TYPES[UA_TYPES_ENDPOINTDESCRIPTION]);
        UA_Client_delete(client);
        return EXIT_SUCCESS;
    }
    printf("%i endpoints found\n", (int)endpointArraySize);
    for(size_t i=0;i<endpointArraySize;i++) {
        printf("URL of endpoint %i is %.*s\n", (int)i,
               (int)endpointArray[i].endpointUrl.length,
               endpointArray[i].endpointUrl.data);
    }
    UA_Array_delete(endpointArray,endpointArraySize, &UA_TYPES[UA_TYPES_ENDPOINTDESCRIPTION]);
    UA_Client_delete(client);

    /* Create a client and connect */
    printf("Creating a client and connecting to the server\n");
    client = UA_Client_new();
    UA_ClientConfig_setDefault(UA_Client_getConfig(client));
    /* Connect to a server */
    /* anonymous connect would be: retval = UA_Client_connect(client, "opc.tcp://localhost:4840"); */
    retval = UA_Client_connect(client, "opc.tcp://localhost:4840");
    if(retval != UA_STATUSCODE_GOOD) {
        printf("Could not connect\n");
        UA_Client_delete(client);
        return EXIT_SUCCESS;
    }


#ifdef UA_ENABLE_SUBSCRIPTIONS
    /* Create a subscription */
    UA_CreateSubscriptionRequest request = UA_CreateSubscriptionRequest_default();
    UA_CreateSubscriptionResponse response = UA_Client_Subscriptions_create(client, request,
                                                                            NULL, NULL, NULL);

    UA_UInt32 subId = response.subscriptionId;
    if(response.responseHeader.serviceResult == UA_STATUSCODE_GOOD)
        printf("Create subscription succeeded, id %u\n", subId);

    UA_MonitoredItemCreateRequest monRequest =
        UA_MonitoredItemCreateRequest_default(UA_NODEID_STRING(1, "the.answer"));

    UA_MonitoredItemCreateResult monResponse =
    UA_Client_MonitoredItems_createDataChange(client, response.subscriptionId,
                                              UA_TIMESTAMPSTORETURN_BOTH,
                                              monRequest, NULL, handler_TheAnswerChanged, NULL);
    if(monResponse.statusCode == UA_STATUSCODE_GOOD)
        printf("Monitoring 'the.answer', id %u\n", monResponse.monitoredItemId);


    /* The first publish request should return the initial value of the variable */
    UA_Client_run_iterate(client, 1000);
#endif

    /* Read attribute */
    UA_Int32 value = 0;
    printf("\nReading the value of node (1, \"the.answer\"):\n");
    UA_Variant *val = UA_Variant_new();
    retval = UA_Client_readValueAttribute(client, UA_NODEID_STRING(1, "the.answer"), val);
    if(retval == UA_STATUSCODE_GOOD && UA_Variant_isScalar(val) &&
       val->type == &UA_TYPES[UA_TYPES_INT32]) {
        value = *(UA_Int32*)val->data;
        printf("the value is: %i\n", value);
    }
    UA_Variant_delete(val);

    /* Write node attribute */
//    value++;
//    printf("\nWriting a value of node (1, \"the.answer\"):\n");
//    UA_WriteRequest wReq;
//    UA_WriteRequest_init(&wReq);
//    wReq.nodesToWrite = UA_WriteValue_new();
//    wReq.nodesToWriteSize = 1;
//    wReq.nodesToWrite[0].nodeId = UA_NODEID_STRING_ALLOC(1, "the.answer");
//    wReq.nodesToWrite[0].attributeId = UA_ATTRIBUTEID_VALUE;
//    wReq.nodesToWrite[0].value.hasValue = true;
//    wReq.nodesToWrite[0].value.value.type = &UA_TYPES[UA_TYPES_INT32];
//    wReq.nodesToWrite[0].value.value.storageType = UA_VARIANT_DATA_NODELETE; /* do not free the integer on deletion */
//    wReq.nodesToWrite[0].value.value.data = &value;
//    UA_WriteResponse wResp = UA_Client_Service_write(client, wReq);
//    if(wResp.responseHeader.serviceResult == UA_STATUSCODE_GOOD)
//        printf("the new value is: %i\n", value);
//    UA_WriteRequest_clear(&wReq);
//    UA_WriteResponse_clear(&wResp);
//
//    /* Write node attribute (using the highlevel API) */
//    value++;
//    UA_Variant *myVariant = UA_Variant_new();
//    UA_Variant_setScalarCopy(myVariant, &value, &UA_TYPES[UA_TYPES_INT32]);
//    UA_Client_writeValueAttribute(client, UA_NODEID_STRING(1, "the.answer"), myVariant);
//    UA_Variant_delete(myVariant);

#ifdef UA_ENABLE_SUBSCRIPTIONS
    /* Take another look at the.answer */
    UA_Client_run_iterate(client, 100);
    /* Delete the subscription */
    if(UA_Client_Subscriptions_deleteSingle(client, subId) == UA_STATUSCODE_GOOD)
        printf("Subscription removed\n");
#endif
    UA_Client_disconnect(client);
    UA_Client_delete(client);
    return EXIT_SUCCESS;
}