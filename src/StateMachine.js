const { _, eachAsync_ } = require('rk-utils');

const buildReason = reason => Array.isArray(reason) ? reason.join(' or ') : reason;

/**
 * 
 * Action rule: 
 *  pre_: pre transition condition check
 *  transform_: transforming before applying to the state 
 *  trigger_: trigger another action after transition
 */

class StateMachine {
    static ACTION_ALLOWED = { allowed: true };
    static actionDisallow = (reason) => ({ allowed: false, reason }); 
    
    constructor(transitionTable, stateFetcher, dataReader, dataWriter) {
        this.transitions = transitionTable;
        this.stateFetcher_ = stateFetcher;
        this.dataReader_ = dataReader;
        this.dataWriter_ = dataWriter;
    }

    /**
     * Get a list of allowed actions based on the current state.     
     * @param {*} context 
     */
    async getAllowedActions_(context, withDisallowedReason) {
        const currentState = await this.stateFetcher_(context);

        //from state
        const transitions = this.transitions[currentState];    
        const allowed = [], disallowed = [];    

        await eachAsync_(transitions, async (rule, action) => {
            const result = await rule.pre_(context);

            if (result.allowed) {
                allowed.push({
                    action,
                    desc: rule.desc,
                    targetState: rule.target
                });
            } else if (withDisallowedReason) {
                disallowed.push({
                    action,
                    desc: rule.desc,
                    targetState: rule.target,
                    reason: result.reason
                });
            }
        });

        const ret = {
            allowed
        };

        if (withDisallowedReason) {
            ret.disallowed = disallowed;
        }

        return ret;
    }
    
    /**
     * Perform the specified action.
     * @param {*} context 
     * @param {*} action 
     * @param {*} payload 
     */
    async performAction_(context, action, payload) {    
        entity = await this.ensureEntityWithState_(entity, connOpts);
        const currentState = entity[this.stateField];
        
        const transitions = this.transitions[currentState];    
        const rule = transitions && transitions[action];

        if (!rule) {
            throw new BadRequest(`The action "${action}" is not available when ${this.stateField} is "${currentState}".`);
        }

        if (rule.pre_) {
            const result = await rule.pre_(ctx, entity);
            if (!result.allowed) {
                throw new Forbidden(`The current state of "${this.entityModel.meta.name}" does not meet the requirements of "${action}" action.`, { reason: buildReason(result.reason) });
            }
        }

        let entityUpdate = (rule.transform_ && (await rule.transform_(ctx, entity, payload))) || { ...payload };  
        if (rule.target) {
            entityUpdate[this.stateField] = rule.target;
        }

        let where = {
            $query: this.keyOfEntity(entity),
            $retrieveDbResult: true
        };

        if (rule.trigger_) {
            where.$retrieveUpdated = true;
        }

        let updated = await this.entityModel.updateOne_(entityUpdate, where, connOpts);
        if (where.$result.affectedRows === 0) {
            throw new ServerError(`Nothing is changed when performing action "${action}" on ${this.stateField} being "${currentState}".`)
        }
    
        if (rule.trigger_) {
            await rule.trigger_(ctx, updated);
        }

        return updated;
    }
}

module.exports = StateMachine;