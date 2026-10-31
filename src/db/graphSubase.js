const {
  SUPABASE_GRAPHQL_URL,
  SUPABASE_API_KEY,
} = process.env;

async function consultarGraphQL(query, variables = {}) {
  if (!SUPABASE_GRAPHQL_URL || !SUPABASE_API_KEY) {
    throw new Error(
      "Faltan SUPABASE_GRAPHQL_URL o SUPABASE_API_KEY en las variables de entorno"
    );
  }

  let respuesta;
  try {
    respuesta = await fetch(SUPABASE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_API_KEY,
        "Authorization": `Bearer ${SUPABASE_API_KEY}`,
      },
      body: JSON.stringify({ query, variables }),
    });
  } catch (err) {
    console.error("Error de conexión:", err);
    const error = new Error("No se pudo conectar con Supabase");
    error.status = 502;
    throw error;
  }

  const texto = await respuesta.text();

  let resultado;
  try {
    resultado = JSON.parse(texto);
  } catch {
    console.error("Respuesta no JSON de Supabase:", texto);
    const error = new Error("Supabase devolvió una respuesta no JSON");
    error.status = 502;
    throw error;
  }

  if (!respuesta.ok || resultado.errors?.length) {
    console.error("HTTP:", respuesta.status);
    console.error("Respuesta de Supabase:", JSON.stringify(resultado, null, 2));

    const detalle = resultado.errors
      ?.map((e) => e.message)
      .join("; ");

    const error = new Error(
      detalle || `Supabase respondió HTTP ${respuesta.status}`
    );
    error.status = respuesta.ok ? 502 : respuesta.status;
    throw error;
  }

  return resultado.data;
}

module.exports = { consultarGraphQL };