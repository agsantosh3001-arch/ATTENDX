async function run() {
  // @ts-ignore
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const pg = new EmbeddedPostgres({
    port: 5432,
    user: 'postgres',
    password: 'postgres',
    database: 'attendx',
    persistent: true,
  });

  try {
    console.log('Initialising embedded postgres...');
    await pg.initialise();
  } catch (e: any) {
    console.log('Postgres initialised notice:', e.message);
  }

  try {
    console.log('Starting embedded postgres on port 5432...');
    await pg.start();
    console.log('Embedded postgres running on port 5432.');
  } catch (e: any) {
    console.log('Postgres start notice:', e.message);
  }

  try {
    await pg.createDatabase('attendx');
    console.log('Database attendx ready.');
  } catch (e: any) {
    console.log('Database attendx notice:', e.message);
  }
}

run().catch(console.error);
