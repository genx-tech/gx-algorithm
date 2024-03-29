const { _ } = require('@genx/july');
const { 
    Types,
    Activators,
    Validators, 
    Processors, 
    Generators, 
    Errors: { ValidationError, DatabaseError }, 
    Utils: { Lang: { isNothing } } 
} = require('@genx/data');
 

module.exports = (Base) => {    
    const QueueSpec = class extends Base {    
        /**
         * Applying predefined modifiers to entity fields.
         * @param context
         * @param isUpdating
         * @returns {*}
         */
        static async applyModifiers_(context, isUpdating) {
            let {raw, latest, existing, i18n} = context;
            existing || (existing = {});
            return context;
        }
    };
    
    QueueSpec.meta = {
        "schemaName": "test",
        "name": "queue",
        "keyField": "id",
        "fields": {
            "id": {
                "type": "text",
                "auto": true,
                "writeOnce": true,
                "fixedLength": 36,
                "generator": "uuid",
                "displayName": "Id"
            },
            "batchId": {
                "type": "text",
                "maxLength": 32,
                "displayName": "Batch Id"
            },
            "job": {
                "type": "text",
                "maxLength": 200,
                "displayName": "Job"
            },
            "dueAt": {
                "type": "datetime",
                "displayName": "Due At"
            },
            "dispatchedAt": {
                "type": "datetime",
                "default": {
                    "oorType": "SymbolToken",
                    "name": "NOW"
                },
                "displayName": "Dispatched At",
                "createByDb": true
            },
            "lockerId": {
                "type": "text",
                "maxLength": 32,
                "emptyAsNull": true,
                "optional": true,
                "displayName": "Locker Id"
            },
            "createdAt": {
                "type": "datetime",
                "auto": true,
                "readOnly": true,
                "writeOnce": true,
                "displayName": "Created At",
                "isCreateTimestamp": true,
                "createByDb": true
            }
        },
        "features": {
            "autoId": {
                "field": "id"
            },
            "createTimestamp": {
                "field": "createdAt"
            }
        },
        "uniqueKeys": [
            [
                "id"
            ],
            [
                "batchId",
                "job"
            ]
        ],
        "indexes": [
            {
                "fields": [
                    "batchId",
                    "job"
                ],
                "unique": true
            },
            {
                "fields": [
                    "lockerId"
                ]
            }
        ],
        "fieldDependencies": {
            "id": [
                {
                    "reference": "id",
                    "writeProtect": true
                }
            ],
            "createdAt": [
                {
                    "reference": "createdAt",
                    "writeProtect": true
                }
            ]
        }
    };

    return Object.assign(QueueSpec, {});
};