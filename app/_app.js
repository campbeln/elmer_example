//##################################################
//#
//#           ** DO NOT EDIT THIS FILE **
//#
//##################################################
//# Version: 2023-02-03
'use strict';

const $formidable = require('formidable');
const $fs = require('fs');
const $ip = require('ip');
//const $url = require('url');
//const $fetch = require('node-fetch-commonjs');


module.exports = async function ($app, $express, $httpServer) {
    $app.app = {
        version: "0.2.2023-02-03",

        data: {},
        config: {
            //# Remove `node index.js` from process.argv (NOTE: ignores any flags sent to `node`)
            args: process.argv.slice(2)
        },
        basicAuthLogins: {
            //# Override basicAuthLogins within app-ex.js, setting the key (which serves as the username) and a password. As-is, all basicAuthLogins calls will fail (by design).
            username: ""
        },

        services: { //# collection of external services
            web: {
                //url: $url,
                multipartForm: function (oRequest, fnOnComplete, oOptions) {
                    let $form = new $formidable.IncomingForm(),
                        oFormData = {
                            formidable: $form,
                            fields: {},
                            files: {}
                        },
                        iMB = (1024 * 1024)
                    ;

                    //#
                    oOptions = $app.extend({
                        fileSizeMb: 200,
                        multiples: true,
                        uploadDir: __dirname + '/app/uploads/',
                        readFileSync: {
                            encoding: "utf8",
                            flag:'r'
                        }
                    }, oOptions);
                    $form.maxFileSize = oOptions.fileSizeMb * iMB;
                    $form.multiples = oOptions.multiples;
                    $form.uploadDir = oOptions.uploadDir;

                    //#
                    $form.on('field', function(sField, sValue) {
                        //# If the sField already exists within oFormData.fields, make sure it's an .arr and .push in the additional sValue
                        if ($app.type.obj.has(oFormData.fields, sField)) {
                            oFormData.fields[sField] = $app.type.arr.mk(oFormData.fields[sField], [ oFormData.fields[sField] ]);
                            oFormData.fields[sField].push(sValue);
                        }
                        //# Else this is the first instance of the sField, so set it in oFormData.fields
                        else {
                            oFormData.fields[sField] = sValue;
                        }
                    });
                    $form.on('file', function(sField, oFile) {
                        //# If the sField already exists within oFormData.fields, make sure it's an .arr and .push in the additional sValue
                        if ($app.type.obj.has(oFormData.files, sField)) {
                            oFormData.files[sField] = $app.type.arr.mk(oFormData.files[sField], [ oFormData.files[sField] ]);
                            oFormData.files[sField].push({
                                file: oFile,
                                getContent: function () {
                                    return $fs.readFileSync(oFile.filepath, oOptions.readFileSync);
                                }
                            });
                        }
                        //# Else this is the first instance of the sField, so set it in oFormData.fields
                        else {
                            oFormData.files[sField] = {
                                file: oFile,
                                getContent: function () {
                                    return $fs.readFileSync(oFile.filepath, oOptions.readFileSync);
                                }
                            };
                        }
                    });
                    $form.on('end', function() {
                        $app.type.fn.run(fnOnComplete, { args: [oFormData] });
                        //fnOnComplete(oFormData);
                    });
                    $form.parse(oRequest);
                },
                express: $express,
                server: $httpServer,
                ip: $ip,
                register: async function () {
                    //# curl -X GET http://localhost:$portLocal/
                    return await $app.io.net.get("http://" + $app.app.config.name + "." + $app.app.config.hostname + ":" + $app.app.config.port + "/?register=true");
                },


                router: (function() {
                    let a_oRegisteredRoutes = [];

                    return $app.extend(
                        function() {
                            return $express.Router();
                        }, //# services.web.router
                        {
                            register: function($router, sRoute /*, bSecure*/) {
                                let oRoute,
                                    bRouteExists = false
                                ;

                                //#
                                //bSecure = $app.type.bool.mk(bSecure, false);

                                //#
                                if ($app.type.str.is(sRoute)) {
                                    oRoute = $app.type.query(a_oRegisteredRoutes, { route: sRoute }, { firstEntryOnly: true, caseInsensitive: true });
                                    bRouteExists = $app.type.obj.is(oRoute, true);

                                    //#
                                    if (!bRouteExists) {
                                        //#
                                        /*if (bSecure) {
                                            $httpServer.use("/" + sRoute, require(__dirname + "/app/middleware/auth.js")($app));
                                        }*/
                                        $httpServer.use("/" + sRoute, $router);

                                        //#
                                        oRoute = {
                                            route: sRoute,
                                            //secure: bSecure,
                                            router: $router
                                        };
                                        a_oRegisteredRoutes.push(oRoute);
                                    }
                                }

                                return $app.extend({
                                    created: !bRouteExists
                                }, oRoute);
                            }, //# router.register

                            registered: function(sRoute, bSecure) {
                                let oRoute,
                                    bRouteExists = false
                                ;

                                //#
                                if ($app.type.str.is(sRoute)) {
                                    oRoute = $app.type.query(a_oRegisteredRoutes, { route: sRoute }, { firstEntryOnly: true, caseInsensitive: true });
                                    bRouteExists = $app.type.obj.is(oRoute, true);
                                }

                                return (bRouteExists &&
                                    (arguments.length === 1 || $app.type.bool.mk(bSecure, false) === oRoute.secure)
                                );
                            } //# router.registered
                        }
                    );
                }()), //# $app.app.services.web.router


                //#
                basicAuth: (function() {
                    $app.extend(
                        function (oRequest, oResponse) {
                            //# Simple Basic Auth with vanilla JavaScript (ES6)
                            //#     Based on: https://stackoverflow.com/a/33905671/235704
                            //#     NOTE: As-is, this will fail (by design) as $app.app.basicAuthLogins.username is set to a null-string (which is falsy during the oBasicAuthLogins[sUsername] check below).
                            let oBasicAuthLogins = $app.app.basicAuthLogins,
                                oReturnVal = {
                                    auth: false,
                                    username: "",
                                    status: $app.io.net.status.clientError.unauthorized,
                                    body: "Authentication required."
                                }
                            ;

                            //# Parse the sUsername:sPassword from the oRequest headers
                            const b64Auth = (oRequest.headers.authorization || '').split(' ')[1] || '';
                            //const sAuth = Buffer.from(b64Auth, 'base64').toString();
                            //const i = sAuth.indexOf(':');
                            //const sUsername = sAuth.substring(0, i);
                            //const sPassword = sAuth.substring(i + 1);
                            const [vIgnore, sUsername, sPassword] = Buffer.from(b64Auth, 'base64').toString().match(/(.*?):(.*)/) || [];

                            //# If the sUsername is valid and the sPassword matches
                            if (sUsername && sPassword && oBasicAuthLogins[sUsername] && sPassword === oBasicAuthLogins[sUsername]) {
                                oReturnVal.auth = true;
                                oReturnVal.username = sUsername;
                                oReturnVal.status = $app.io.net.status.success.ok;
                                oReturnVal.body = undefined;
                            }
                            //# Else access is denied, so if we were passed a oResponse respond for the caller
                            else if (oResponse && $app.type.fn.is(oResponse.set)) {
                                oResponse.set('WWW-Authenticate', 'Basic realm="' + $app.app.config.name + '"');
                                oResponse.status(401).send(oReturnVal.body);
                            }

                            return oReturnVal;
                        },
                        {
                            headers: function (sUsername, sPassword, oHeaders) {
                                //# See: https://gomakethings.com/api-authentication-with-vanilla-js/
                                return $app.extend(
                                    oHeaders || {},
                                    {
                                        'Authorization': `Basic ${$app.type.str.btoa(sUsername)}:${$app.type.str.btoa(sPassword)}`
                                    }
                                );
                            } //# $app.app.services.web.basicAuth.headers
                        }
                    );
                }()), //# $app.app.services.web.basicAuth


                //# Determines if the vAPIName(s) heartbeat endpoint are up and running
                apiUp: async function (vAPIName) {
                    let oAPIResponse, i,
                        a_sAPINames = $app.type.arr.mk(vAPIName, [vAPIName]),
                        oReturnVal = {
                            ok: true,
                            responses: []
                        }
                    ;

                    //#
                    for (i = 0; i < a_sAPINames.length; i++) {
                        //#
                        oAPIResponse = await $app.io.net.get(
                            "http://" + a_sAPINames[i] + "." + $app.app.config.hostname + ":" + $app.app.config.port + "/"
                        );
                        oReturnVal.responses.push(oAPIResponse);

                        //#
                        oReturnVal.ok = (oReturnVal.ok &&
                            oAPIResponse &&
                            oAPIResponse.ok &&
                            $app.type.str.is(oAPIResponse.message, true) &&
                            $app.type.date.is(oAPIResponse.time)
                        );
                    }

                    return oReturnVal;
                } //# $app.app.services.web.apiUp
            }, //# $app.app.services.web

            fs: {
                fs: $fs,
                baseDir: __dirname + "/../",

                //#
                requireDir: function(sDir, a_sExcludeFiles, fnCallback) {
                    let requireDirRecurse = function (sPath, sDirectory) {
                        $app.app.services.fs.fs.readdirSync(sPath).forEach(function(sFile) {
                            let oFS = {
                                file: sFile,
                                dir: sPath + "/",
                                path: sPath + "/" + sFile,
                                url: sDirectory.replace(/^\/routes/i, "") + $app.type.str.mk(sFile).replace(/\.js$/i, "")
                            };

                            //#
                            if ($app.app.services.fs.fs.lstatSync(oFS.path).isDirectory()) {
                                requireDirRecurse(oFS.path, sFile + "/");
                            }
                            //#
                            else if ($app.type.str.is(sFile, true) && a_sExcludeFiles.indexOf(sFile) === -1) {
                                fnCallback(require(oFS.path), oFS);
                            }
                        });
                    }; //# requireDirRecurse

                    //#
                    sDir = $app.type.str.mk(sDir);
                    sDir = (sDir[0] !== "/" ? "/" : "") + sDir;
                    a_sExcludeFiles = $app.type.arr.mk(a_sExcludeFiles);
                    fnCallback = $app.type.fn.mk(fnCallback, function (fnRequiredFile /*, oFS*/) {
                        fnRequiredFile($app);
                    });

                    //# Kick off the recursive process
                    requireDirRecurse(__dirname + sDir, sDir);
                } //# $app.app.services.fs.requireDir
            } //# $app.app.services.fs

        }, //# $app.app.services

        log: {
            api: function (oData, oRequest) {
                //# oData = { status, json, error }
            }
        }, //# $app.app.log

        error: {
            response: function (oResponse, vErrorMessage, iHTTPCode) {
                let sErrorMessage = ($app.type.obj.is(vErrorMessage) ? vErrorMessage.message : vErrorMessage),
                    oDetails = $app.resolve(vErrorMessage, "details")
                ;

                oResponse
                    .status($app.type.int.mk(iHTTPCode, 500))
                    .json({
                        success: false,
                        error: sErrorMessage || "An unknown error occurred.",
                        details: oDetails
                    })
                ;
            }
        } //# $app.app.error
    };
};
