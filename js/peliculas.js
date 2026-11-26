
// ========================================
// CINE DE NOSOTROS
// ADMINISTRACIÓN DE PELÍCULAS
// ========================================

const formularioPelicula =
    document.getElementById("form-pelicula");

const listaPeliculas =
    document.getElementById("lista-peliculas");

const mensajeFormulario =
    document.getElementById("mensaje-formulario");

const botonGuardar =
    document.getElementById("btn-guardar");


// ========================================
// INICIALIZAR DASHBOARD
// ========================================

async function iniciarDashboard() {

    const autorizado = await verificarAdministrador();

    if (!autorizado) return;

    document.getElementById("btn-cerrar-sesion")
        .addEventListener("click", cerrarSesion);

    document.getElementById("btn-actualizar")
        .addEventListener("click", cargarPeliculas);

    formularioPelicula.addEventListener(
        "submit",
        guardarPelicula
    );

    await cargarPeliculas();
}


// ========================================
// GUARDAR PELÍCULA Y FUNCIÓN
// ========================================

async function guardarPelicula(e) {

    e.preventDefault();

    botonGuardar.disabled = true;
    botonGuardar.textContent = "GUARDANDO...";

    mensajeFormulario.textContent = "";

    const titulo = document.getElementById("titulo").value.trim();
    const descripcion = document.getElementById("descripcion").value.trim();
    const portada = document.getElementById("portada").value.trim();

    const fecha = document.getElementById("fecha").value;
    const horario = document.getElementById("horario").value;

    const publicada = document.getElementById("publicada").checked;

    try {

        // 1. Crear película

        const { data: pelicula, error: errorPelicula } =
            await window.supabaseClient
                .from("movies")
                .insert({
                    title: titulo,
                    description: descripcion || null,
                    poster_url: portada || null,
                    published: publicada
                })
                .select("id")
                .single();

        if (errorPelicula) throw errorPelicula;


        // 2. Crear primera función

        const { error: errorFuncion } =
            await window.supabaseClient
                .from("screenings")
                .insert({
                    movie_id: pelicula.id,
                    show_date: fecha,
                    show_time: horario,
                    is_available: true
                });

        // Si falla la función, intentamos eliminar
        // la película recién creada para no dejarla incompleta.

        if (errorFuncion) {

            const { error: errorLimpieza } =
                await window.supabaseClient
                    .from("movies")
                    .delete()
                    .eq("id", pelicula.id);

            if (errorLimpieza) {
                throw new Error(
                    "No se pudo crear la función y tampoco limpiar " +
                    "la película: " + errorFuncion.message
                );
            }

            throw errorFuncion;
        }


        // 3. Mostrar resultado

        mensajeFormulario.textContent =
            "¡Película y función registradas correctamente!";

        mensajeFormulario.style.color = "#9bd6a1";

        formularioPelicula.reset();

        await cargarPeliculas();

    } catch (error) {

        console.error("Error al guardar:", error);

        mensajeFormulario.textContent =
            "No se pudo guardar: " + error.message;

        mensajeFormulario.style.color = "#e5a3a3";

    } finally {

        botonGuardar.disabled = false;
        botonGuardar.textContent = "+ AGREGAR PELÍCULA";

    }
}


// ========================================
// CONSULTAR PELÍCULAS
// ========================================

async function cargarPeliculas() {

    listaPeliculas.textContent = "Cargando películas...";

    const { data, error } =
        await window.supabaseClient
            .from("movies")
            .select(`
                id,
                title,
                description,
                poster_url,
                published,
                screenings (
                    id,
                    show_date,
                    show_time,
                    is_available
                )
            `)
            .order("created_at", { ascending: false });

    if (error) {

        console.error(error);

        listaPeliculas.textContent =
            "Error al cargar películas: " + error.message;

        return;
    }

    actualizarEstadisticas(data);

    listaPeliculas.replaceChildren();

    if (data.length === 0) {

        const vacio = document.createElement("p");

        vacio.textContent =
            "Todavía no hay películas registradas.";

        listaPeliculas.appendChild(vacio);

        return;
    }

    data.forEach(pelicula => {

        const tarjeta = crearTarjetaPelicula(pelicula);

        listaPeliculas.appendChild(tarjeta);

    });
}


// ========================================
// ESTADÍSTICAS
// ========================================

function actualizarEstadisticas(peliculas) {

    const funciones = peliculas.reduce(
        (total, pelicula) =>
            total + (pelicula.screenings?.length || 0),
        0
    );

    const publicadas = peliculas.filter(
        pelicula => pelicula.published
    ).length;

    document.getElementById("total-peliculas").textContent =
        peliculas.length;

    document.getElementById("total-funciones").textContent =
        funciones;

    document.getElementById("total-publicadas").textContent =
        publicadas;
}


// ========================================
// CREAR TARJETA DE PELÍCULA
// ========================================

function crearTarjetaPelicula(pelicula) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "tarjeta-pelicula-admin";

    // Portada

    const imagen = document.createElement("img");

    imagen.alt = "Portada de " + pelicula.title;

    if (pelicula.poster_url) {

        imagen.src = pelicula.poster_url;

        imagen.onerror = () => {
            imagen.removeAttribute("src");
        };

    } else {

        imagen.alt = "Sin portada disponible";

    }

    // Información

    const informacion = document.createElement("div");

    informacion.className = "informacion-pelicula";

    const titulo = document.createElement("h3");

    titulo.textContent = pelicula.title;

    const descripcion = document.createElement("p");

    descripcion.textContent =
        pelicula.description || "Sin descripción.";

    const estado = document.createElement("p");

    estado.className = "estado-publicacion";

    estado.textContent = pelicula.published
        ? "● Publicada"
        : "● No publicada";

    informacion.append(titulo, descripcion, estado);

    // Funciones

    const funciones = pelicula.screenings || [];

    funciones.forEach(funcion => {

        const detalle = document.createElement("p");

        detalle.textContent =
            "Función: " + funcion.show_date +
            " · " + funcion.show_time.slice(0, 5) +
            " · " + (funcion.is_available
                ? "Disponible"
                : "No disponible");

        informacion.appendChild(detalle);

    });

    // Acciones

    const acciones = document.createElement("div");

    acciones.className = "acciones-pelicula";

    const botonPublicar = document.createElement("button");

    botonPublicar.textContent = pelicula.published
        ? "Retirar de cartelera"
        : "Publicar";

    botonPublicar.addEventListener("click", () => {
        cambiarPublicacion(pelicula.id, !pelicula.published);
    });

    const botonEliminar = document.createElement("button");

    botonEliminar.textContent = "Eliminar";

    botonEliminar.addEventListener("click", () => {
        eliminarPelicula(pelicula.id, pelicula.title);
    });

    acciones.append(botonPublicar, botonEliminar);

    tarjeta.append(imagen, informacion, acciones);

    return tarjeta;
}


// ========================================
// PUBLICAR / RETIRAR
// ========================================

async function cambiarPublicacion(id, nuevoEstado) {

    const { error } =
        await window.supabaseClient
            .from("movies")
            .update({ published: nuevoEstado })
            .eq("id", id);

    if (error) {

        alert("No se pudo actualizar: " + error.message);

        return;
    }

    await cargarPeliculas();
}


// ========================================
// ELIMINAR PELÍCULA
// ========================================

async function eliminarPelicula(id, titulo) {

    const confirmar = confirm(
        '¿Seguro que deseas eliminar "' + titulo + '"? ' +
        "También se eliminarán sus funciones."
    );

    if (!confirmar) return;

    const { error } =
        await window.supabaseClient
            .from("movies")
            .delete()
            .eq("id", id);

    if (error) {

        alert("No se pudo eliminar: " + error.message);

        return;
    }

    alert("Película eliminada correctamente.");

    await cargarPeliculas();
}


// ========================================
// EJECUTAR
// ========================================

iniciarDashboard();
