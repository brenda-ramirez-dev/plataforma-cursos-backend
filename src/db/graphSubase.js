'use strict';

const {
  SUPABASE_GRAPHQL_URL,
  SUPABASE_API_KEY,
} = process.env;

async function consultarGraphQL(query, variables = {}) {
  if (!SUPABASE_GRAPHQL_URL || !SUPABASE_API_KEY) {
    const error = new Error(
      'Falta configurar SUPABASE_GRAPHQL_URL o SUPABASE_API_KEY.'
    );
    error.status = 503;
    throw error;
  }

  let response;

  try {
    response = await fetch(SUPABASE_GRAPHQL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_API_KEY,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (cause) {
    const error = new Error('No se pudo conectar con Supabase GraphQL.');
    error.status = 502;
    error.cause = cause;
    throw error;
  }

  const result = await response.json();

  if (!response.ok || result.errors?.length) {
    const error = new Error(
      result.errors?.map((item) => item.message).join('; ') ||
      `Supabase respondió HTTP ${response.status}.`
    );
    error.status = 502;
    throw error;
  }

  return result.data;
}

module.exports = { consultarGraphQL };
