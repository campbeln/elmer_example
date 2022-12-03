//#
module.exports = function($app, $router /*, $baseRouter */) {
    'use strict';

    //$router = $app.app.services.web.router();


    //# curl -X GET http://localhost:3000/example/byid/123 -H 'Content-Type: application/json' -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNuIiwicm9sZSI6MCwiaWF0IjoxNjQwODQ3NzAwLCJleHAiOjE2NDA4NTEzMDB9.pGwQnctoytxpozWJPVlibkwCv1YauWhckKY7HFuHpC4'
    //# curl -X GET http://localhost:3000/example/byid/letters -H 'Content-Type: application/json' -H 'Authorization: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNuIiwicm9sZSI6MCwiaWF0IjoxNjQwODQ3NzAwLCJleHAiOjE2NDA4NTEzMDB9.pGwQnctoytxpozWJPVlibkwCv1YauWhckKY7HFuHpC4'
    //# curl -X GET http://localhost:3000/example/byid/123 -H 'Content-Type: application/json'
    //# curl -X GET http://localhost:3000/example2/byid/123 -H 'Content-Type: application/json'
    $router.get('/byid/:id', async (oRequest, oResponse) => {
        var iID = $app.type.int.mk(oRequest.params.id);
        //const $fetch = require('node-fetch-common.js');

        oResponse.status(200).json({ id: iID, boilerplate: true });
    });



    //#
    //return $router;
}; //# module.exports
