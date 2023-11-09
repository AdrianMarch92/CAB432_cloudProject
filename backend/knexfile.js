// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
    client: 'pg',
    connection: {
        host : 'cloudproject-team42.ce2haupt2cta.ap-southeast-2.rds.amazonaws.com',
        port : 5432,
        user : 'placeholder',
        password : 'placeholder',
        database : 'traffic',
        ssl: {
            rejectUnauthorized: false, // or false based on your configuration
            // Other SSL options can be added here, like ca, cert, key, etc.
          }
    }
};