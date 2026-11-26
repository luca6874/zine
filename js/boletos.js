
// ========================================
// BOLETOS
// CINE DE NOSOTROS
// ========================================

const mensajeBoleto = document.getElementById("mensaje-boleto");
const areaBoleto = document.getElementById("area-boleto");
const accionesBoleto = document.getElementById("acciones-boleto");
const botonDescargar = document.getElementById("btn-descargar");

let boletoListo = false;


// ========================================
// OBTENER ID DE LA FUNCIÓN
// ========================================

const parametros = new URLSearchParams(window.location.search);
const idFuncion = parametros.get("funcion");


// ========================================
// CARGAR BOLETO
// ========================================

async function cargarBoleto() {

    if (!idFuncion) {
        mostrarError("No seleccionaste ninguna función.");
        return;
    }

    mensajeBoleto.textContent = "Consultando tu función...";

    try {

        // 1. Consultar función y película

        const { data: funcion, error } =
            await window.supabaseClient
                .from("screenings")
                .select(`
                    id,
                    show_date,
                    show_time,
                    ticket_cost,
                    is_available,
                    movies (
                        title
                    )
                `)
                .eq("id", idFuncion)
                .eq("is_available", true)
                .single();

        if (error) throw error;

        if (!funcion || !funcion.movies) {
            throw new Error("No se encontró la película de esta función.");
        }

        const pelicula = funcion.movies;

        // 2. Determinar diseño según horario

        const hora = funcion.show_time.slice(0, 5);
        const esNocturno = hora >= "19:00";

        const archivo = esNocturno
            ? "assets/tickets/boleto-noche.html"
            : "assets/tickets/boleto-dia.html";

        // 3. Cargar diseño original

        mensajeBoleto.textContent = "Preparando el diseño del boleto...";

        const respuesta = await fetch(archivo);

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el diseño del boleto.");
        }

        const html = await respuesta.text();

        const documento = new DOMParser().parseFromString(
            html,
            "text/html"
        );

        const selector = esNocturno
            ? ".ticket-bw-wrapper"
            : ".ticket-red-wrapper";

        const diseno = documento.querySelector(selector);

        if (!diseno) {
            throw new Error("No se encontró el diseño del boleto.");
        }

        // 4. Insertar diseño

        areaBoleto.replaceChildren(
            document.importNode(diseno, true)
        );

        // 5. Colocar información real

        if (esNocturno) {
            actualizarBoletoNocturno(funcion, pelicula);
        } else {
            actualizarBoletoDiurno(funcion, pelicula);
        }

        // 6. Mostrar boleto

        areaBoleto.hidden = false;
        accionesBoleto.hidden = false;

        mensajeBoleto.textContent = "¡Tu boleto está listo! ♡";

        boletoListo = true;

    } catch (error) {

        console.error("Error al generar boleto:", error);

        mostrarError(
            "No se pudo preparar el boleto: " + error.message
        );

    }

}


// ========================================
// ACTUALIZAR BOLETO NOCTURNO
// ========================================

function actualizarBoletoNocturno(funcion, pelicula) {

    const boleto = areaBoleto.querySelector(".ticket-bw");

    const nombre = boleto.querySelector(".movie-name-bw");
    const filas = boleto.querySelectorAll(".stub-bw-row");

    nombre.textContent = "PELÍCULA: " + pelicula.title;

    filas[0].textContent =
        "FECHA: " + formatearFecha(funcion.show_date);

    filas[1].textContent =
        "HORA: " + formatearHora12(funcion.show_time);

    filas[2].textContent =
        "COSTO: " + (funcion.ticket_cost || "SORPRESA ♡");

}


// ========================================
// ACTUALIZAR BOLETO DIURNO
// ========================================

function actualizarBoletoDiurno(funcion, pelicula) {

    const boleto = areaBoleto.querySelector(".ticket-red");

    const nombre = boleto.querySelector(".red-movie-title");
    const nombreStub = boleto.querySelector(".stub-red-movie");
    const columnas = boleto.querySelectorAll(".red-detail-col");
    const costo = boleto.querySelector(".stub-red-bottom-right");

    nombre.textContent = "PELÍCULA: " + pelicula.title;

    nombreStub.textContent = "“" + pelicula.title + "”";

    columnas[0].textContent =
        formatearFechaLarga(funcion.show_date) +
        " " + formatearHora24(funcion.show_time) +
        " HRS.";

    costo.textContent =
        "COSTO: " + (funcion.ticket_cost || "SORPRESA ♡");

}


// ========================================
// FORMATO DE FECHA
// ========================================

function formatearFecha(fecha) {

    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;

}


function formatearFechaLarga(fecha) {

    const [anio, mes, dia] = fecha.split("-");

    const meses = [
        "ENERO", "FEBRERO", "MARZO",
        "ABRIL", "MAYO", "JUNIO",
        "JULIO", "AGOSTO", "SEPTIEMBRE",
        "OCTUBRE", "NOVIEMBRE", "DICIEMBRE"
    ];

    return `${dia} DE ${meses[Number(mes) - 1]}`;

}


function formatearHora24(hora) {

    return hora.slice(0, 5);

}


function formatearHora12(hora) {

    let [horas, minutos] = hora.slice(0, 5).split(":");

    let numeroHoras = Number(horas);

    const periodo = numeroHoras >= 12 ? "P.M." : "A.M.";

    numeroHoras = numeroHoras % 12 || 12;

    return `${String(numeroHoras).padStart(2, "0")}:${minutos} ${periodo}`;

}


// ========================================
// DESCARGAR BOLETO JPG
// ========================================

async function descargarBoleto() {

    if (!boletoListo) return;

    botonDescargar.disabled = true;
    botonDescargar.textContent = "GENERANDO IMAGEN...";

    try {

        await document.fonts.ready;

        const boleto = areaBoleto.firstElementChild;

        const lienzo = await html2canvas(boleto, {
            scale: 2,
            useCORS: true,
            backgroundColor: null
        });

        const enlace = document.createElement("a");

        enlace.download = "boleto-cine-de-nosotros.jpg";

        enlace.href = lienzo.toDataURL("image/jpeg", 0.95);

        enlace.click();

    } catch (error) {

        console.error("Error al descargar:", error);

        alert("No se pudo generar la imagen del boleto.");

    } finally {

        botonDescargar.disabled = false;
        botonDescargar.textContent = "DESCARGAR BOLETO JPG ↓";

    }

}


// ========================================
// MOSTRAR ERROR
// ========================================

function mostrarError(mensaje) {

    mensajeBoleto.textContent = mensaje;

    areaBoleto.hidden = true;
    accionesBoleto.hidden = true;

    document.getElementById("volver-error").hidden = false;

}


// ========================================
// EVENTOS
// ========================================

botonDescargar.addEventListener("click", descargarBoleto);


// ========================================
// INICIAR
// ========================================

cargarBoleto();
