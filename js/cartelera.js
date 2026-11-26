
// ========================================
// CARTELERA
// CINE DE NOSOTROS
// ========================================

const listaCartelera = document.getElementById("lista-cartelera");


// ========================================
// CARGAR PELÍCULAS
// ========================================

async function cargarCartelera() {

    listaCartelera.textContent = "Cargando cartelera...";

    const { data, error } =
        await window.supabaseClient
            .from("movies")
            .select(`
                id,
                title,
                description,
                poster_url,
                screenings (
                    id,
                    show_date,
                    show_time,
                    ticket_cost,
                    is_available
                )
            `)
            .eq("published", true)
            .eq("screenings.is_available", true)
            .order("created_at", { ascending: false });

    if (error) {

        console.error("Error al cargar cartelera:", error);

        listaCartelera.textContent =
            "No se pudo cargar la cartelera. Intenta nuevamente.";

        return;
    }

    listaCartelera.replaceChildren();

    if (!data || data.length === 0) {

        mostrarMensaje(
            "Todavía no hay películas disponibles. ¡Pronto tendremos nuevas funciones! ♡"
        );

        return;
    }

    data.forEach(pelicula => {

        const tarjeta = crearTarjeta(pelicula);

        listaCartelera.appendChild(tarjeta);

    });

}


// ========================================
// CREAR TARJETA
// ========================================

function crearTarjeta(pelicula) {

    const tarjeta = document.createElement("article");

    tarjeta.className = "tarjeta-cartelera";


    // PORTADA

    const contenedorPortada = document.createElement("div");

    if (pelicula.poster_url) {

        const imagen = document.createElement("img");

        imagen.className = "portada-pelicula";
        imagen.src = pelicula.poster_url;
        imagen.alt = "Portada de " + pelicula.title;
        imagen.loading = "lazy";

        imagen.onerror = () => {

            const faltante = document.createElement("div");

            faltante.className = "portada-faltante";
            faltante.textContent = "SIN PORTADA";

            imagen.replaceWith(faltante);

        };

        contenedorPortada.appendChild(imagen);

    } else {

        const faltante = document.createElement("div");

        faltante.className = "portada-faltante";
        faltante.textContent = "SIN PORTADA";

        contenedorPortada.appendChild(faltante);

    }


    // INFORMACIÓN

    const informacion = document.createElement("div");

    informacion.className = "informacion-pelicula";

    const titulo = document.createElement("h3");

    titulo.textContent = pelicula.title;

    informacion.appendChild(titulo);


    if (pelicula.description) {

        const descripcion = document.createElement("p");

        descripcion.className = "descripcion-pelicula";
        descripcion.textContent = pelicula.description;

        informacion.appendChild(descripcion);

    }


    // FUNCIONES

    const etiqueta = document.createElement("p");

    etiqueta.className = "etiqueta-funciones";
    etiqueta.textContent = "FUNCIONES DISPONIBLES";

    informacion.appendChild(etiqueta);


    const listaFunciones = document.createElement("div");

    listaFunciones.className = "lista-funciones";

    const funciones = pelicula.screenings || [];

    if (funciones.length === 0) {

        const sinFunciones = document.createElement("p");

        sinFunciones.className = "sin-funciones";
        sinFunciones.textContent = "No hay funciones disponibles.";

        listaFunciones.appendChild(sinFunciones);

    } else {

        funciones
            .filter(funcion => funcion.is_available)
            .sort((a, b) => {

                const fechaA = a.show_date + " " + a.show_time;
                const fechaB = b.show_date + " " + b.show_time;

                return fechaA.localeCompare(fechaB);

            })
            .forEach(funcion => {

                const elemento = crearFuncion(funcion);

                listaFunciones.appendChild(elemento);

            });

    }

    informacion.appendChild(listaFunciones);

    tarjeta.append(contenedorPortada, informacion);

    return tarjeta;

}


// ========================================
// CREAR FUNCIÓN
// ========================================

function crearFuncion(funcion) {

    const contenedor = document.createElement("div");

    contenedor.className = "funcion-cartelera";


    // FECHA Y HORARIO

    const detalle = document.createElement("div");

    detalle.className = "detalle-funcion";


    const horario = document.createElement("span");

    horario.className = "horario-funcion";

    horario.textContent =
        formatearFecha(funcion.show_date) +
        " · " +
        funcion.show_time.slice(0, 5);


    // COSTO

    const costo = document.createElement("span");

    costo.className = "costo-funcion";

    costo.textContent =
        funcion.ticket_cost || "Costo sorpresa ♡";


    detalle.append(horario, costo);


    // BOTÓN

    const boton = document.createElement("button");

    boton.className = "boton-elegir-funcion";

    boton.type = "button";

    boton.textContent = "ELEGIR ESTA FUNCIÓN →";

    boton.addEventListener("click", () => {

        window.location.href =
            "boletos.html?funcion=" +
            encodeURIComponent(funcion.id);

    });


    contenedor.append(detalle, boton);

    return contenedor;

}


// ========================================
// FORMATEAR FECHA
// ========================================

function formatearFecha(fecha) {

    const partes = fecha.split("-");

    if (partes.length !== 3) {
        return fecha;
    }

    return partes[2] + "/" + partes[1] + "/" + partes[0];

}


// ========================================
// MENSAJES
// ========================================

function mostrarMensaje(mensaje) {

    const elemento = document.createElement("p");

    elemento.className = "mensaje-cartelera";
    elemento.textContent = mensaje;

    listaCartelera.appendChild(elemento);

}


// ========================================
// INICIAR
// ========================================

cargarCartelera();
