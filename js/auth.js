
// ========================================
// CINE DE NOSOTROS
// AUTENTICACIÓN Y PERMISOS
// ========================================

// Verificar que el usuario tenga permisos
async function verificarAdministrador() {

    const { data: { session }, error } =
        await window.supabaseClient.auth.getSession();

    if (error || !session) {
        window.location.href = "login.html";
        return false;
    }

    const { data: esAdmin, error: errorAdmin } =
        await window.supabaseClient.rpc("is_admin");

    if (errorAdmin || !esAdmin) {
        await window.supabaseClient.auth.signOut();
        window.location.href = "login.html";
        return false;
    }

    return true;
}

// Cerrar sesión
async function cerrarSesion() {

    const { error } =
        await window.supabaseClient.auth.signOut();

    if (error) {
        alert("No se pudo cerrar la sesión.");
        return;
    }

    window.location.href = "login.html";
}

// Iniciar sesión
async function iniciarSesion(correo, contrasena) {

    const { data, error } =
        await window.supabaseClient.auth.signInWithPassword({
            email: correo,
            password: contrasena
        });

    if (error) {
        return {
            success: false,
            message: "Correo o contraseña incorrectos."
        };
    }

    const { data: esAdmin, error: errorAdmin } =
        await window.supabaseClient.rpc("is_admin");

    if (errorAdmin || !esAdmin) {
        await window.supabaseClient.auth.signOut();

        return {
            success: false,
            message: "Esta cuenta no tiene permisos administrativos."
        };
    }

    return {
        success: true,
        user: data.user
    };
}
