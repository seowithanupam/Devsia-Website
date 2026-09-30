# Real-database tests (opt-in)

`npm test` never touches MongoDB. These extra tests exercise the repository layer against a real MongoDB: every
create, read, update and delete the admin panel relies on, the unique indexes, first-admin creation, the sign-in throttle,
the session version, and what the public site reads back.

## How to run them

```
npm run test:db               # explains what would happen, then stops. Nothing is run or written.
npm run test:db -- --confirm  # runs the tests
```

It reads `.env.local`. It uses `MONGODB_TEST_URI` if you set it, otherwise the cluster and login from `MONGODB_URI`.
The connection string is never printed.

## What it will and will not touch

- It creates a brand-new database named `devsia_test_<random>` and works only there.
- It does **not** touch the database named in your connection string. Your content is safe.
- Three separate safeguards enforce this:
  1. the test refuses to start unless the connected database name starts with `devsia_test_` and is not your URI's own database;
  2. the runner removes your app's `MONGODB_URI` from the environment the tests run in, and the test replaces it with an unusable address, so no app code can reach your content database;
  3. at the end only that throwaway database is dropped (or, if your user may not drop databases, its collections are emptied one by one).

## What you need

A database user that may create databases on the cluster, for example the Atlas role `readWriteAnyDatabase`.
If the user in `MONGODB_URI` is limited to one database, create a second Atlas user and put its connection string in
`MONGODB_TEST_URI` in `.env.local` (the app never reads that variable).

If a run is interrupted, any database whose name starts with `devsia_test_` can be deleted in Atlas (Browse Collections).

## Reading the result

`npm test` will list these tests as "skipped". That is expected. `npm run test:db -- --confirm` runs only `tests/db`.
If a test fails, the message names the collection or step; paste it and it can be fixed.
