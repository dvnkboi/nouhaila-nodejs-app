/* eslint-disable no-process-env */

import { createPool } from 'mysql';
import BaseDb from 'mysql-async-wrapper';
import MySQLEvents from '@rodrigogs/mysql-events';
import { EventEmitter } from 'events';
import SqlString from 'sqlstring';
import { config } from 'dotenv';
const BaseDatabase = BaseDb.default;
config();


export class Connector {

    constructor(dbName) {
        this.dbName = dbName;
        //mysql config const
        this.config = { // connection to db with config
            host: process.env.MYSQL_DB_HOST,
            user: process.env.MYSQL_DB_USER,
            password: process.env.MYSQL_DB_PASS,
            database: this.dbName,
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0
        };
        try {
            this.pool = createPool(this.config);
            this.db;
            this.connection;
        }
        catch (err) {
            console.error('error creating model with given config');
        }
        this.watcher = {};


        //manage TTL of connection, is connection does not query for more than ttl, it disconnects 
        this.life = {
            keepAlive: false,
            ttl: 10000,
            timeout: null,
            watcherCount: 0,
            isConnected: false
        };
        this.defaultLimit = 20;
        this.limit;
        this.offset = 0;
        this.sortRef;
        this.sortDir = 'asc';
        this.eventHandler = {
            timeout: 0,
            allow: true,
            throttle: true,
            event: new EventEmitter(),
            hasDied: false
        };
    }
    // reset timer, same logic as last event in file listening
    async manageLife() {
        let proxy = this;
        if (this.life.timeout != null) {
            clearTimeout(this.life.timeout);
            this.life.timeout = null;
        }
        if (this.life.watcherCount < 1) {
            this.life.timeout = setTimeout(async () => {
                if (this.life.isConnected) {
                    await proxy.disconnect();
                }
            }, proxy.life.ttl);
        }
    }

    async connect() {
        if (!this.life.isConnected) {
            this.life.isConnected = true;
            const maxRetryCount = 3; // Number of Times To Retry
            const retryErrorCodes = ["ER_LOCK_DEADLOCK", "ERR_LOCK_WAIT_TIMEOUT"]; // Retry On which Error Codes 
            try {
                this.db = new BaseDatabase(this.pool, { //wrap mysql pool in async/await compatible class
                    maxRetryCount,
                    retryErrorCodes
                });
                this.connection = await this.db.getConnection();
                console.info('connected to ' + this.dbName + ' SQL');
                return true;
            }
            catch (e) {
                console.error(e);
                return false;
            }

        }
    }

    async watch(schema) {
        await this.connect();
        this.life.watcherCount++;
        let proxy = this;
        if (Object.keys(this.watcher).length === 0 && this.watcher.constructor === Object) {
            this.watcher = new MySQLEvents(this.pool, {
                startAtEnd: true,
                excludedSchemas: {
                    mysql: true,
                },
            });

            this.watcher.on(MySQLEvents.EVENTS.CONNECTION_ERROR, console.error);
            this.watcher.on(MySQLEvents.EVENTS.ZONGJI_ERROR, console.error);

            try {
                await this.watcher.start();
            }
            catch (e) {
                console.error(e);
            }
        }
        try {
            console.log('watcher started on ' + schema);
        }
        catch (e) {
            console.log('watcher started on ' + schema);
        }

        this.watcher.addTrigger({
            name: schema,
            expression: schema,
            statement: MySQLEvents.STATEMENTS.ALL,
            onEvent: async (event) => {
                if (proxy.eventHandler.throttle) {
                    if (proxy.eventHandler.allow) {
                        proxy.eventHandler.allow = false;

                        proxy.eventHandler.event.emit(schema, event);

                        setTimeout(() => {
                            proxy.eventHandler.allow = true;
                        }, proxy.eventHandler.timeout);
                    }
                }
                else {
                    proxy.eventHandler.event.emit(schema, event);
                    proxy.eventHandler.allow = true;
                }
            },
        });

    }

    async unwatch(schema) {
        this.life.watcherCount--;
        await this.watcher.removeTrigger({
            name: schema,
            expression: schema,
            statement: MySQLEvents.STATEMENTS.ALL,
        });
    }

    async getMatching(table, col, ref, strict) { //get all items matching col == ref or col like %ref%
        await this.manageLife();
        await this.connect();

        //default limit
        this.limit = this.limit ? this.limit : this.defaultLimit;

        let query;

        //escaping
        table = SqlString.escape(table).split("'").join("");
        col = SqlString.escape(col).split("'").join("");
        ref = SqlString.escape(ref).split("'").join("");

        //pagination and sort
        let queryLimit;
        let querySort;

        this.limit = parseInt(SqlString.escape(this.limit));
        this.offset = this.offset ? parseInt(SqlString.escape(this.offset)) : 0;
        queryLimit = `LIMIT ${this.limit} OFFSET ${this.offset} `;

        if (this.sortRef) {
            this.sortRef = SqlString.escape(this.sortRef).split("'").join("");
            this.sortDir = SqlString.escape(this.sortDir).split("'").join("");
            if (this.sortDir == 'asc') {
                querySort = `ORDER BY ${this.sortRef} ASC `;
            }
            else if (this.sortDir == 'desc') {
                querySort = `ORDER BY ${this.sortRef} DESC `;
            }
        }
        else {
            querySort = ``;
        }


        if (Number.isInteger(ref)) {
            ref = parseInt(ref);
            query = `Select * from ${table} where ${col} = ${ref} `;
        }
        else {
            if (strict == true) {
                query = `Select * from ${table} where ${col} = '${ref}' `;
            }
            else {
                query = `Select * from ${table} where ${col} like '%${ref}%' `;
            }
        }

        query += querySort + queryLimit;
        try {
            const res = await this.connection.executeQuery(query, []);
            return res;
        }
        catch (err) {
            console.error(err);
            return null;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }

    }

    async getAll(table, nolimit) {
        await this.manageLife();
        await this.connect();

        //escaping
        table = SqlString.escape(table).split("'").join("");

        //pagination and sort
        let queryLimit;
        let querySort;
        this.limit = this.limit ? this.limit : this.defaultLimit;

        if (!nolimit) {
            this.limit = parseInt(SqlString.escape(this.limit));
            this.offset = this.offset ? parseInt(SqlString.escape(this.offset)) : 0;
            queryLimit = `LIMIT ${this.limit} OFFSET ${this.offset} `;
        }

        if (this.sortRef) {
            this.sortRef = SqlString.escape(this.sortRef).split("'").join("");
            this.sortDir = SqlString.escape(this.sortDir).split("'").join("");
            if (this.sortDir == 'asc') {
                querySort = `ORDER BY ${this.sortRef} ASC `;
            }
            else if (this.sortDir == 'desc') {
                querySort = `ORDER BY ${this.sortRef} DESC `;
            }
        }
        else {
            querySort = ``;
        }
        let query = `Select * from ${table} ` + querySort + queryLimit;

        try {
            const res = await this.connection.executeQuery(query, []);

            return res;
        }
        catch (err) {
            console.error(err);
            return null;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }


    }

    async getFields(table) {
        await this.manageLife();
        await this.connect();

        const query = `show columns from ${table}`;

        try {
            const res = await this.connection.executeQuery(query, []);
            return res;
        }
        catch (err) {
            console.error(err);
            return null;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }
    }

    async getTables() {
        await this.manageLife();
        await this.connect();

        let query = `SELECT table_name as 'table' FROM information_schema.tables WHERE table_schema = "${this.config.database}"`;

        try {
            const res = await this.connection.executeQuery(query, []);
            return res;
        }
        catch (err) {
            return null;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }
    }

    async getNumOfRows(table) {
        await this.manageLife();
        await this.connect();

        let query = `Select count(*) as "count" from ${table}`;

        try {
            const res = await this.connection.executeQuery(query, []);
            return res[0].count;
        }
        catch (err) {
            return 0;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }

    }
    //if true , listen just to the first event
    setThrottle(throttle) {
        if (typeof throttle == 'boolean') {
            this.eventHandler.throttle = throttle;
        }
    }

    setThrottleTimeout(timeout) {
        if (typeof timeout == 'number') {
            this.eventHandler.timeout = timeout;
        }
    }

    async insert(table, object) {
        await this.manageLife();
        await this.connect();

        let query = `insert into ${table}(`;

        for (const key of Object.keys(object)) {
            query += `${key},`;
        }

        query = query.substring(0, query.length - 1);
        query += ') values(';


        for (const value of Object.values(object)) {
            query += `${typeof value == 'string' ? `'${value}'` : value},`;
        }

        query = query.substring(0, query.length - 1);
        query += ')';

        try {
            const res = await this.connection.executeQuery(query, []);
            return res;
        }
        // eslint-disable-next-line no-unreachable
        catch (err) {
            console.log(err);
            return false;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }

    }

    async remove(table, col, ref) {
        await this.manageLife();
        await this.connect();
        //code to remove item from db

        const query = `delete from ${table} where ${col} = '${ref}'`;

        try {
            const res = await this.connection.executeQuery(query, []);
            return res;
        }
        // eslint-disable-next-line no-unreachable
        catch (err) {
            console.log(err);
            return false;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }

    }

    async update(table, col, ref, object) {
        await this.manageLife();
        await this.connect();

        let query = `update ${table} set `;

        for (const key of Object.keys(object)) {
            query += `${key} = '${object[key]}', `;
        }

        query = query.substring(0, query.length - 2);

        query += ` where ${col} = '${ref}'`;

        try {
            const res = await this.connection.executeQuery(query, []);
            return res;
        }
        // eslint-disable-next-line no-unreachable
        catch (err) {
            console.log(err);
            return false;
        }
        finally {
            //this.disconnect(); // To Release Connection
            //console.log('disconnected');
        }

    }

    async disconnect() {
        this.life.isConnected = false;
        try {
            console.info('disconnected from ', this.dbName);
            this.db.close();
            this.eventHandler.hasDied = true;
            this.eventHandler.event.emit('died');
        }
        catch (e) {
            console.log('could not disconnect');
        }
    }

    setDb(dbName) {
        this.life.isConnected = false;
        this.dbName = dbName;
        //mysql config const
        this.config = { // connection to db with config
            host: process.env.MYSQL_DB_HOST,
            user: process.env.MYSQL_DB_USER,
            password: process.env.MYSQL_DB_PASS,
            database: this.dbName,
            connectionLimit: 10,
            waitForConnections: true,
            queueLimit: 0
        };
        try {
            this.pool = createPool(this.config);
            this.db = null;
            this.connection = null;
        }
        catch (err) {
            console.error('error creating model with given config');
        }
    }

    on(type, cb) {
        return this.eventHandler.event.on(type, cb);
    }

    off(type, cb) {
        return this.eventHandler.event.off(type, cb);
    }

    once(type, cb) {
        return this.eventHandler.event.once(type, cb);
    }

}

export const mysqlInstance = new Connector(process.env.MYSQL_DB_NAME);
export default mysqlInstance;

