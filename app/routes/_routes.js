//##################################################
//#
//#           ** DO NOT EDIT THIS FILE **
//#
//##################################################
//# Version: 2023-02-02
module.exports = function ($app) {
    'use strict';

    let $baseRouter = $app.app.services.web.router();



    //# Setup the root/heartbeat route
    //# curl -X GET http://localhost:3000/
    $baseRouter.get("/", async (oRequest, oResponse) => {
        let oQuerystring = $app.io.web.queryString.parse(oRequest.url),
            bRegister = $app.type.bool.mk(oQuerystring.register, false),
            bLogin = $app.type.bool.mk(oQuerystring.login, false)
        ;

        //# If this is a bRegister call, bRegister
        if (bRegister) {
            let sIP = ($app.app.config.baseElmer ?
                    $app.app.config.name + "." + $app.app.config.hostname :
                    $app.app.services.web.ip.address() //# https://www.abstractapi.com/guides/node-js-get-ip-address
                ),
                oAPIResponse = await $app.io.net.get(
                    "http://" + $app.app.config.net + "." + $app.app.config.hostname + ":" + $app.app.config.port +
                        "/elmer/proxy/?route=" + $app.app.config.name +
                        "&port=" + $app.app.config.port +
                        "&secure=" + $app.type.bool.mk($app.app.config.secure, false) +
                        "&force=" + $app.type.bool.mk($app.app.config.forceRegister, true) +
                        "&ip=" + sIP
                )
            ;

            oResponse.status(oAPIResponse.ok ? 200 : 500).json({ registered: oAPIResponse.ok, api: oAPIResponse });
        }
        //# Setup the login route
        else if (bLogin) {
            let oLogin = $app.app.services.web.login(oRequest);

            oResponse.status(200).json(oLogin);
        }
        //#
        else {
            oResponse.status(200).json({
                message: "Hi 👋 from " + $app.app.config.name,
                time: new Date(),
                localTime: $app.type.date.format(new Date(), "YYYY-MM-DD HH:mm:ss")
            });
        }
    }); //# "/"


    //# .register our $baseRouter then .requireDir of all the other /routes, processing each in turn
    $app.app.services.web.router.register($baseRouter, "");
    $app.app.services.fs.requireDir("routes", ["_routes.js", "www.js"], function (fnRequiredFile, oFS) {
        let $fileRouter = $app.app.services.web.router();

        //# Pass in the above-created $fileRouter along with our $baseRouter to the fnRequiredFile, overriding with any returned value from it then .register it
        $fileRouter = fnRequiredFile($app, $fileRouter, $baseRouter) || $fileRouter;
        //console.log(oFS.url);
        $app.app.services.web.router.register($fileRouter, oFS.url);
    });

    //# Register a route without using $app.app.services.web.router.register
    //$app.app.services.web.router.register("example2"); //# <= works the same as the following line:
    //$app.app.services.web.server.use("/example2", require("./elmer.js")($app));
};
