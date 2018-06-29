#!/usr/bin/env node
'use strict';
const SSH = require('simple-ssh');
var _ = require('lodash');
const AWS = require("aws-sdk");
AWS.config.update({region: 'ap-southeast-2'});

const ssm = new AWS.SSM();

const hostkey = process.env.hostkey;
const userkey = process.env.userkey;
const pkey = process.env.pkey;

/**
 * Turn an event into an ssh execution string.
 *
 * Compiles JavaScript templates into functions that can
 * can interpolate values, using <%= .. %>.
 *
 * Template object (event) is interpolated within the
 * template string (environment variable "cmd")
 *
 * Eg.
 *     templateString: 'mycommand --arg1 <%= code %>'
 *     templateObject: 'code: myarg'
 *
 *   Will result in a string of:
 *      'mycommand --arg1 myarg'
 */
function create_execution_string(event) {
    var compiled = _.template(process.env.cmd);
    return compiled(event);
}

exports.execute_ssh_command = (event, context, callback) => {
        let req = {
                   Names: [hostkey, userkey, pkey],
                   WithDecryption: true
        };
        let keys = ssm.getParameters(req).promise();

        keys.catch(function(err) {
            console.log(err);
            callback(`Error loading SSM keys: ${err}`);
        });

        keys.then((data) => {
            let params = {};
            for (let p of data.Parameters) {
                 params[p.Name] = p.Value;
            }

            var ssh = new SSH({
                               host: params[hostkey],
                               user: params[userkey],
                               key: params[pkey],
                               });

            console.log(`Host key: ${params[hostkey]}`);
            console.log(`User key: ${params[userkey]}`);

            let command = create_execution_string(event);

            console.log(`Executing: ${command}`);

	        ssh.exec(command, {
                     exit: (code, stdout, stderr) => {
                        if (stderr) {
                                   console.log(`STDERR: ${stderr}`);
                                   //  Return error with error information back to the caller
                                   return callback(`Failed to execute SSH command, ${stderr}`);
                        } else {
                                   console.log(`STDOUT: ${stdout}`);
                                   const response = { statusCode: 200, body: 'SSH command executed.' };
                                   // Return success with information back to the caller
                                   return callback(null, response);
                        }
                     }
                   })
               .start({
                   success: () => console.log(`Successfully connected to ${params[hostkey]}`),
                   fail: (err) => console.log(`Failed to connect to ${params[hostkey]} system: ${err}`)
               });
        });
};