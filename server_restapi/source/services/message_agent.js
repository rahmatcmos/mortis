
/*jslint node: true */
'use strict';

var dotenv          = require ( 'dotenv'        ).config(),
    _               = require ( 'lodash'        ),
    Promise         = require ( 'bluebird'      ),
    chalk           = require ( 'chalk'         ),
    Redis           = require ( 'ioredis'       ),
    Primus          = require ( 'primus'        ),
    Metroplex       = require ( 'metroplex'     ),
    OmegaSupreme    = require ( 'omega-supreme' ),
    sprintf         = require ( 'sprintf'       ),
    PrimusEmit      = require ( 'primus-emit'   );

// ////////////////////////////////////////////////////////////////////////////
//
// common requirements,

var constant_server_restapi = require ( '../common/constant_server_restapi' );

// ////////////////////////////////////////////////////////////////////////////
//
// message relay, real-time framework for work with sockets
//
// using primus as an abstration around the real-time framework in use ( uws )
// ref https://remysharp.com/2014/11/10/muddling-my-way-through-real-time

module.exports = function ( )
{
    var vm = this || {};

    vm._service_name = 'message_agent';

    vm.api =
    {
        ctor         : ctor,

        service_name : service_name
    };

    vm.redis;
    vm.primus_options;
    vm.primus;

    function ctor ( central_relay, storage_agent, restapi_agent )
    {
        return new Promise ( function ( resolve, reject )
        {
            var retval = false;

            // ////////////////////////////////////////////////////////////////
            //
            // framework resources

            vm.central_relay = central_relay;
            vm.storage_agent = storage_agent;
            vm.restapi_agent = restapi_agent;

            // ////////////////////////////////////////////////////////////////
            //
            // instance setup

            service_init ( ).then (

                function ( value )
                {
                },
                function ( error )
                {
                    throw ( error )
                }

            ).catch (

                function ( ex )
                {
                    console.log ( chalk.green ( '!!! ERROR : Unable to load -', vm._service_name ) );
                }

            ).finally (

                function ( )
                {

                    // ////////////////////////////////////////////////////////////////
                    //
                    // subscriptions

                    vm.central_relay.subscribe ( constant_server_restapi.restapi_listening,
                                                 on_central_relay_restapi_listening );

                    vm.central_relay.subscribe ( constant_server_restapi.scheduled_minute,
                                                 on_central_relay_scheduled_minute  );

                    vm.central_relay.subscribe ( constant_server_restapi.twilio_posted,
                                                 on_central_relay_twilio_posted  );

                    // ////////////////////////////////////////////////////////////////

                    console.log ( chalk.green ( 'on the line :', service_name ( ) ) );

                    retval = true;

                    resolve ( retval );

                }

            );

        } );

    }

    function service_name ( )
    {
        return vm._service_name;
    }

    function service_init ( )
    {
        return new Promise ( function ( resolve, reject )
        {
            if ( 'localhost' === process.env.RD_SERVER_HOST )
            {
                vm.redis = new Redis (
                {
                    port        : process.env.RD_SERVER_PORT,   // Redis port
                    host        : process.env.RD_SERVER_HOST,   // Redis host
                    family      : process.env.RD_SERVER_FAMILY, // 4 (IPv4) or 6 (IPv6)
                    db          : process.env.RD_SERVER_DATA,

                } );

            } else
            {
                vm.redis = new Redis (
                {
                    port        : process.env.RD_SERVER_PORT,   // Redis port
                    host        : process.env.RD_SERVER_HOST,   // Redis host
                    family      : process.env.RD_SERVER_FAMILY, // 4 (IPv4) or 6 (IPv6)
                    password    : process.env.RD_SERVER_AUTH,
                    db          : process.env.RD_SERVER_DATA,

                } );

            }

            vm.redis.on ( "error", function ( err )
            {
                console.log ( "!!! Redis Error -", err );

            } );

            resolve ( vm.redis );

        } );

    }

    function on_central_relay_restapi_listening ( data, envelope )
    {
        console.log ( chalk.green ( 'starting message agent' ) );

        vm.http_server = vm.restapi_agent.http_server_get ( );

        vm.primus_options =
        {
            transformer : 'uws',
            redis       : vm.redis,
            namespace   : 'metroplex'
        };

        vm.primus = new Primus ( vm.http_server, vm.primus_options );

        // add the Primus middleware ( after instantiation )

        vm.primus.plugin ( 'metroplex',        Metroplex    );
        vm.primus.plugin ( 'omega-supreme',    OmegaSupreme );
        vm.primus.plugin ( 'emit',             PrimusEmit   );

        // query the registered servers

        vm.primus.metroplex.servers ( function ( err, servers )
        {
            console.log ( 'other servers: %d', servers.length, servers );

        } );

        // vm.primus.save ( __dirname + '/../../../common/source/lib_primus.js' );

        // when we get a connection...
        vm.primus.on ( 'connection', function ( spark )
        {
            // the inbound socket is referred to as a "spark"

            console.log ( 'whoa.. they do exist -', spark.id );

            // respond to ping events with a pong

            spark.on ( 'ping', function ()
            {
                spark.emit ( 'pong' );

            } );

            list_spark_count ( );

        } );

        vm.primus.on ( 'disconnection', function ( spark )
        {
            // the spark that disconnected

            console.log ( 'noop.. all gone -', spark.id );

            list_spark_count ( );

        } );

        console.log ( chalk.green ( 'message agent started' ) );
    }

    function on_central_relay_scheduled_minute ( data, envelope )
    {
        var message_text = sprintf ( 'scheduled minute :%02s', data.info );

        console.log ( message_text );

        message_every (
        {
            type : constant_server_restapi.scheduled_minute,
            text : message_text
        } );
    }

    function on_central_relay_twilio_posted ( data, envelope )
    {
        console.log ( 'twilio posted' );

        message_every (
        {
            type : constant_server_restapi.twilio_posted,
            text : ''
        } );

    }

    function list_spark_count ( )
    {
        var active_connection_count = 0;

        vm.primus.forEach ( function ( spark, id, connections )
        {
            active_connection_count++;

            console.log ( '    active spark -', spark.id );

        } );

        console.log ( 'active spark count -', active_connection_count );
    }

    function message_every  ( info )
    {
        vm.primus.forEach ( function ( spark, id, connections )
        {
            spark.write ( info );

        } );

    }

    return vm.api;
};
