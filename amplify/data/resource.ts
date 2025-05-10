import { type ClientSchema, a, defineData } from '@aws-amplify/backend';

/*== STEP 1 ===============================================================
The section below creates a ProcessedImage database table with fields for
"uri", "timestamp", "status", "style", and "timeRemaining". The authorization
rule below specifies that any unauthenticated user can "create", "read",
"update", and "delete" any "ProcessedImage" records.
=========================================================================*/
const schema = a.schema({
  ProcessedImage: a
    .model({
      uri: a.string().required(),
      timestamp: a.integer().required(),
      status: a.enum(['cooking', 'queued', 'finished']),
      style: a.string(),
      timeRemaining: a.integer(),
    })
    .authorization((allow) => [allow.guest()]),
});

// Used for code completion / highlighting when making requests from frontend
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
});

/*== STEP 2 ===============================================================
Go to your frontend source code. From your client-side code, generate a
Data client to make CRUDL requests to your table. (THIS SNIPPET WILL ONLY
WORK IN THE FRONTEND CODE FILE.)

Using JavaScript or Next.js React Server Components, Middleware, Server 
Actions or Pages Router? Review how to generate Data clients for those use
cases: https://docs.amplify.aws/gen2/build-a-backend/data/connect-to-API/
=========================================================================*/

/*
"use client"
import { generateClient } from "aws-amplify/data";
import type { Schema } from "@/amplify/data/resource";

const client = generateClient<Schema>() // use this Data client for CRUDL requests
*/

/*== STEP 3 ===============================================================
Fetch records from the database and use them in your frontend component.
(THIS SNIPPET WILL ONLY WORK IN THE FRONTEND CODE FILE.)
=========================================================================*/

/* For example, in a React component, you can use this snippet in your
  function's RETURN statement */
// const { data: processedImages } = await client.models.ProcessedImage.list()

// return <ul>{processedImages.map(image => <li key={image.id}>{image.uri}</li>)}</ul>
