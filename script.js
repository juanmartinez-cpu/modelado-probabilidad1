// --- CONFIGURACIÓN GLOBAL DE GRÁFICOS (CHART.JS) ---
let chartC8 = null;
let chartC9 = null;
let datosC9Global = []; // Almacenar datos del CSV para cálculos dinámicos
let parametrosC9Global = {}; // Guardar parámetros calculados del dataset

document.addEventListener("DOMContentLoaded", () => {
    inicializarPestanas();
    inicializarControlesC8();
    inicializarControlesC9();
    
    // Render inicial por defecto
    ejecutarSimulacionC8();
});

// --- LÓGICA DE INTERFAZ (PESTAÑAS) ---
function inicializarPestanas() {
    const btnC8 = document.getElementById("btn-pestana-c8");
    const btnC9 = document.getElementById("btn-pestana-c9");
    const secC8 = document.getElementById("seccion-c8");
    const secC9 = document.getElementById("seccion-c9");

    btnC8.addEventListener("click", () => {
        btnC8.classList.add("active");
        btnC9.classList.remove("active");
        secC8.style.display = "block";
        secC9.style.display = "none";
    });

    btnC9.addEventListener("click", () => {
        btnC9.classList.add("active");
        btnC8.classList.remove("active");
        secC9.style.display = "block";
        secC8.style.display = "none";
    });
}

// --- FASE C8: SIMULACIÓN INTERACTIVA ---
function inicializarControlesC8() {
    const selectorDist = document.getElementById("selector-dist");
    const tipoCalculo = document.getElementById("tipo-calculo-c8");
    const contenedorX2 = document.getElementById("contenedor-x2");

    // Cambiar parámetros visibles según distribución
    selectorDist.addEventListener("change", () => {
        document.querySelectorAll(".grupo-parametros").forEach(el => el.style.display = "none");
        const distSeleccionada = selectorDist.value;
        if (distSeleccionada === "uniforme") document.getElementById("inputs-uniforme").style.display = "block";
        else if (distSeleccionada === "triangular") document.getElementById("inputs-triangular").style.display = "block";
        else if (distSeleccionada === "lineal") document.getElementById("inputs-lineal").style.display = "block";
        else if (distSeleccionada === "porpartes") document.getElementById("inputs-porpartes").style.display = "block";
        else if (distSeleccionada === "normal") document.getElementById("inputs-normal").style.display = "block";
    });

    // Ocultar campo X2 si se evalúa solo menor o mayor a un punto
    tipoCalculo.addEventListener("change", () => {
        if (tipoCalculo.value === "entre") {
            contenedorX2.style.display = "block";
        } else {
            contenedorX2.style.display = "none";
        }
    });

    document.getElementById("btn-calcular").addEventListener("click", ejecutarSimulacionC8);
}

// --- FUNCIONES DE DENSIDAD DE PROBABILIDAD (PDF) ---
function pdfUniforme(x, a, b) {
    return (x >= a && x <= b) ? (1 / (b - a)) : 0;
}

function pdfTriangular(x, a, b, c) {
    if (x < a || x > b) return 0;
    if (x >= a && x < c) return (2 * (x - a)) / ((b - a) * (c - a));
    if (x === c) return 2 / (b - a);
    return (2 * (b - x)) / ((b - a) * (b - c));
}

function pdfLineal(x, a, b, tipo) {
    if (x < a || x > b) return 0;
    const h = 2 / (b - a); // Altura máxima para que el área total sea 1
    if (tipo === "creciente") {
        return (h / (b - a)) * (x - a);
    } else {
        return h - (h / (b - a)) * (x - a);
    }
}

function pdfPorPartes(x) {
    // Definición fija de dos tramos uniformes continuos acoplados con Área total = 1
    // Tramo 1: [0, 4] con altura 0.15 -> Área = 0.60
    // Tramo 2: (4, 10] con altura 0.0666... -> Área = 0.40
    if (x >= 0 && x <= 4) return 0.15;
    if (x > 4 && x <= 10) return 0.40 / 6;
    return 0;
}

function pdfNormal(x, mu, sigma) {
    const exponente = -Math.pow(x - mu, 2) / (2 * Math.pow(sigma, 2));
    return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(exponente);
}

// --- INTEGRADOR NUMÉRICO PARA CÁLCULO DE ÁREAS (PROBABILIDAD REAL) ---
function calcularProbabilidadMuestral(x1, x2, dist, params) {
    let area = 0;
    const pasos = 800;
    const inicio = Math.max(x1, params.minRef);
    const fin = Math.min(x2, params.maxRef);
    
    if (inicio >= fin) return 0;
    const dx = (fin - inicio) / pasos;

    for (let i = 0; i < pasos; i++) {
        const x = inicio + (i * dx) + (dx / 2);
        let y = 0;
        if (dist === "uniforme") y = pdfUniforme(x, params.a, params.b);
        else if (dist === "triangular") y = pdfTriangular(x, params.a, params.b, params.c);
        else if (dist === "lineal" || dist === "linear") y = pdfLineal(x, params.a, params.b, params.tipo);
        else if (dist === "porpartes" || dist === "piecewise") y = pdfPorPartes(x);
        else if (dist === "normal") y = pdfNormal(x, params.mu, params.sigma);
        area += y * dx;
    }
    return area;
}

function ejecutarSimulacionC8() {
    const dist = document.getElementById("selector-dist").value;
    const modoCalculo = document.getElementById("tipo-calculo-c8").value;
    
    let params = { minRef: -5, maxRef: 15 };
    let x1 = parseFloat(document.getElementById("prob-x1").value) || 0;
    let x2 = parseFloat(document.getElementById("prob-x2").value) || 0;

    // Capturar y validar parámetros según distribución
    if (dist === "uniforme") {
        params.a = parseFloat(document.getElementById("uni-a").value);
        params.b = parseFloat(document.getElementById("uni-b").value);
        if (params.a >= params.b) { alert("El límite 'a' debe ser menor que 'b'"); return; }
        params.minRef = params.a - (params.b - params.a) * 0.2;
        params.maxRef = params.b + (params.b - params.a) * 0.2;
    } else if (dist === "triangular") {
        params.a = parseFloat(document.getElementById("tri-a").value);
        params.b = parseFloat(document.getElementById("tri-b").value);
        params.c = parseFloat(document.getElementById("tri-c").value);
        if (params.a >= params.b || params.c < params.a || params.c > params.b) {
            alert("Validar restricciones: a < c < b"); return;
        }
        params.minRef = params.a - (params.b - params.a) * 0.2;
        params.maxRef = params.b + (params.b - params.a) * 0.2;
    } else if (dist === "lineal") {
        params.tipo = document.getElementById("lin-tipo").value;
        params.a = parseFloat(document.getElementById("lin-a").value);
        params.b = parseFloat(document.getElementById("lin-b").value);
        if (params.a >= params.b) { alert("El intervalo 'a' debe ser menor que 'b'"); return; }
        params.minRef = params.a - (params.b - params.a) * 0.2;
        params.maxRef = params.b + (params.b - params.a) * 0.2;
    } else if (dist === "porpartes") {
        params.minRef = -1;
        params.maxRef = 11;
    } else if (dist === "normal") {
        params.mu = parseFloat(document.getElementById("norm-mu").value);
        params.sigma = parseFloat(document.getElementById("norm-sigma").value);
        if (params.sigma <= 0) { alert("La desviación estándar debe ser mayor a 0"); return; }
        params.minRef = params.mu - (4 * params.sigma);
        params.maxRef = params.mu + (4 * params.sigma);
    }

    // Configurar límites evaluados según requerimiento estricto (Bajo, Alto, Entre)
    let evaluadoMin = x1;
    let evaluadoMax = x2;
    if (modoCalculo === "menor") {
        evaluadoMin = params.minRef;
        evaluadoMax = x1;
    } else if (modoCalculo === "mayor") {
        evaluadoMin = x1;
        evaluadoMax = params.maxRef;
    }

    // Calcular la probabilidad numérica real
    const resP = calcularProbabilidadMuestral(evaluadoMin, evaluadoMax, dist, params);
    document.getElementById("valor-p").innerText = resP.toFixed(4);

    // Generar vectores de datos dinámicos para construir el gráfico continuo
    const puntos = 200;
    const pasoEje = (params.maxRef - params.minRef) / puntos;
    let etiquetasX = [];
    let curvaPDF = [];
    let curvaSombreado = [];

    for (let i = 0; i <= puntos; i++) {
        const x = params.minRef + (i * pasoEje);
        etiquetasX.push(x.toFixed(2));
        
        let y = 0;
        if (dist === "uniforme") y = pdfUniforme(x, params.a, params.b);
        else if (dist === "triangular") y = pdfTriangular(x, params.a, params.b, params.c);
        else if (dist === "lineal") y = pdfLineal(x, params.a, params.b, params.tipo);
        else if (dist === "porpartes") y = pdfPorPartes(x);
        else if (dist === "normal") y = pdfNormal(x, params.mu, params.sigma);
        
        curvaPDF.push(y);

        // Pintar o sombrear dinámicamente solo la región evaluada
        if (x >= evaluadoMin && x <= evaluadoMax) {
            curvaSombreado.push(y);
        } else {
            curvaSombreado.push(null);
        }
    }

    // Dibujar o actualizar gráfico Chart.js
    if (chartC8) chartC8.destroy();
    const ctx = document.getElementById("graficoPDF").getContext("2d");
    chartC8 = new Chart(ctx, {
        type: "line",
        data: {
            labels: etiquetasX,
            datasets: [
                {
                    label: "Área de Probabilidad Shaded",
                    data: curvaSombreado,
                    backgroundColor: "rgba(37, 99, 235, 0.35)",
                    fill: true,
                    pointRadius: 0,
                    borderWidth: 0
                },
                {
                    label: "Función de Densidad (PDF)",
                    data: curvaPDF,
                    borderColor: "#1e3a8a",
                    borderWidth: 2.5,
                    pointRadius: 0,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { x: { display: true }, y: { beginAtZero: true } },
            plugins: { legend: { display: false } }
        }
    });
}

// --- FASE C9: LECTOR INTELIGENTE Y AJUSTE EMPÍRICO MASIVO ---
function inicializarControlesC9() {
    const inputArchivo = document.getElementById("cargar-archivo");
    const tipoCalculo = document.getElementById("tipo-calculo-c9");
    const contenedorV2 = document.getElementById("contenedor-c9-v2");

    inputArchivo.addEventListener("change", () => {
        const spanNombre = document.getElementById("nombre-archivo-seleccionado");
        if (inputArchivo.files.length > 0) {
            spanNombre.innerText = "Archivo cargado: " + inputArchivo.files[0].name;
        }
    });

    tipoCalculo.addEventListener("change", () => {
        if (tipoCalculo.value === "entre") contenedorV2.style.style.display = "block";
        else contenedorV2.style.display = "none";
    });

    document.getElementById("btn-ajustar").addEventListener("click", procesarArchivoDataset);
    document.getElementById("btn-calcular-c9").addEventListener("click", calcularProbabilidadC9);
}

function procesarArchivoDataset() {
    const inputArchivo = document.getElementById("cargar-archivo");
    if (inputArchivo.files.length === 0) {
        alert("Por favor, selecciona primero uno de los datasets .csv de la plataforma.");
        return;
    }

    const archivo = inputArchivo.files[0];
    const lector = new FileReader();

    lector.onload = function(e) {
        const contenido = e.target.result;
        // Parseador e integrador robusto: Limpia celdas cualitativas o texto
        const lineas = contenido.split(/[\r\n]+/);
        let valoresExtraidos = [];

        lineas.forEach(linea => {
            const celdas = linea.split(/[,;\t]+/);
            celdas.forEach(celda => {
                const limpio = celda.trim().replace(",", ".");
                const num = parseFloat(limpio);
                if (!isNaN(num) && isFinite(num)) {
                    valoresExtraidos.push(num);
                }
            });
        });

        if (valoresExtraidos.length === 0) {
            alert("No se detectaron columnas con variables numéricas válidas en el archivo.");
            return;
        }

        datosC9Global = valoresExtraidos.sort((x, y) => x - y);
        ejecutarAjusteEstadistico();
    };

    lector.readAsText(archivo);
}

function ejecutarAjusteEstadistico() {
    const modeloElegido = document.getElementById("selector-fit").value;
    const N = datosC9Global.length;
    const min = datosC9Global[0];
    const max = datosC9Global[N - 1];
    
    // Cálculo de momentos muestrales
    let suma = 0;
    datosC9Global.forEach(v => suma += v);
    const media = suma / N;

    let sumaVarianza = 0;
    datosC9Global.forEach(v => sumaVarianza += Math.pow(v - media, 2));
    const desviacion = Math.sqrt(sumaVarianza / (N - 1 || 1));

    // Estimar parámetros según el modelo teórico elegido por el usuario (Exigido C9)
    parametrosC9Global = { dist: modeloElegido, minRef: min - (max - min) * 0.1, maxRef: max + (max - min) * 0.1 };

    let txtParametros = `<strong>Variables analizadas (N):</strong> ${N}<br>`;
    let interpretacion = "";

    if (modeloElegido === "normal") {
        parametrosC9Global.mu = media;
        parametrosC9Global.sigma = desviacion || 0.1;
        txtParametros += `<strong>Media Muestral (μ):</strong> ${media.toFixed(4)}<br><strong>Desviación (σ):</strong> ${desviacion.toFixed(4)}`;
        interpretacion = "El ajuste con la campana de Gauss es altamente razonable si los datos acumulados se concentran alrededor de la media central y exhiben colas simétricas decrecientes en los bordes.";
    } else if (modeloElegido === "uniforme") {
        parametrosC9Global.a = min;
        parametrosC9Global.b = max;
        txtParametros += `<strong>Mínimo Estimado (a):</strong> ${min.toFixed(4)}<br><strong>Máximo Estimado (b):</strong> ${max.toFixed(4)}`;
        interpretacion = "El modelo uniforme es consistente si el histograma empírico muestra una distribución relativamente plana y rectangular, donde todos los subintervalos poseen frecuencias similares.";
    } else if (modeloElegido === "triangular") {
        parametrosC9Global.a = min;
        parametrosC9Global.b = max;
        parametrosC9Global.c = media; // Moda aproximada por la media estructural
        txtParametros += `<strong>Mínimo (a):</strong> ${min.toFixed(4)}<br><strong>Máximo (b):</strong> ${max.toFixed(4)}<br><strong>Moda Estimada (c):</strong> ${media.toFixed(4)}`;
        interpretacion = "El ajuste triangular es adecuado si se observa un crecimiento lineal claro hacia un punto de frecuencia máxima central (moda) y un decrecimiento lineal posterior.";
    } else if (modeloElegido === "linear") {
        parametrosC9Global.a = min;
        parametrosC9Global.b = max;
        parametrosC9Global.tipo = (media < (min + max) / 2) ? "decreciente" : "creciente";
        txtParametros += `<strong>Rango:</strong> [${min.toFixed(2)}, ${max.toFixed(2)}]<br><strong>Pendiente:</strong> ${parametrosC9Global.tipo.toUpperCase()}`;
        interpretacion = "Modelo Lineal Continuo. Es adecuado si la densidad de datos disminuye o aumenta progresivamente de un extremo al otro en un tramo uniforme.";
    } else if (modeloElegido === "piecewise") {
        parametrosC9Global.minRef = -1;
        parametrosC9Global.maxRef = 11;
        txtParametros += `<strong>Tipo:</strong> Dos Tramos Uniformes Continuos<br><strong>Nodos Fijos:</strong> [0, 4, 10]`;
        interpretacion = "Modelo por Partes (Piecewise). Útil cuando la muestra se compone de subpoblaciones adyacentes con densidades de probabilidad claramente diferenciadas.";
    }

    document.getElementById("valores-estimados").innerHTML = txtParametros;
    document.getElementById("interpretacion-texto").innerText = interpretacion;
    document.getElementById("panel-parametros-estimados").style.display = "block";

    // CONSTRUIR EL HISTOGRAMA EMPÍRICO FRENTE A LA PDF TEÓRICA EN EL MISMO GRÁFICO (Exigido C9)
    const totalClases = 12; 
    const anchoClase = (max - min) / totalClases;
    let clasesFrecuencias = new Array(totalClases).fill(0);
    let centrosClase = [];

    for (let i = 0; i < totalClases; i++) {
        centrosClase.push(min + (i * anchoClase) + (anchoClase / 2));
    }

    datosC9Global.forEach(v => {
        let indice = Math.floor((v - min) / anchoClase);
        if (indice >= totalClases) indice = totalClases - 1;
        if (indice < 0) indice = 0;
        clasesFrecuencias[indice]++;
    });

    // Convertir histograma de frecuencia absoluta a densidad de área total = 1
    let histogramaDensidad = clasesFrecuencias.map(f => f / (N * anchoClase));

    // Mapear la curva continua de la PDF sobre las mismas marcas de clase
    let lineaFittedPDF = centrosClase.map(x => {
        let p = parametrosC9Global;
        if (modeloElegido === "normal") return pdfNormal(x, p.mu, p.sigma);
        if (modeloElegido === "uniforme") return pdfUniforme(x, p.a, p.b);
        if (modeloElegido === "triangular") return pdfTriangular(x, p.a, p.b, p.c);
        if (modeloElegido === "linear") return pdfLineal(x, p.a, p.b, p.tipo);
        if (modeloElegido === "piecewise") return pdfPorPartes(x);
        return 0;
    });

    // Renderizar gráfico compuesto
    if (chartC9) chartC9.destroy();
    const ctx = document.getElementById("graficoHistograma").getContext("2d");
    chartC9 = new Chart(ctx, {
        data: {
            labels: centrosClase.map(c => c.toFixed(2)),
            datasets: [
                {
                    type: "bar",
                    label: "Histograma Frecuencia (Muestra Empírica)",
                    data: histogramaDensidad,
                    backgroundColor: "rgba(15, 118, 110, 0.5)",
                    borderColor: "#0f766e",
                    borderWidth: 1,
                    barPercentage: 1.0,
                    categoryPercentage: 1.0
                },
                {
                    type: "line",
                    label: "Curva PDF Teórica Ajustada",
                    data: lineaFittedPDF,
                    borderColor: "#b91c1c",
                    borderWidth: 3,
                    pointRadius: 3,
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true } }
        }
    });
}

// --- CALCULAR PROBABILIDAD DEL MODELO AJUSTADO (Exigido C9) ---
function calcularProbabilidadC9() {
    if (datosC9Global.length === 0) return;

    const modo = document.getElementById("tipo-calculo-c9").value;
    const v1 = parseFloat(document.getElementById("c9-v1").value) || 0;
    const v2 = parseFloat(document.getElementById("c9-v2").value) || 0;

    let evalMin = v1;
    let evalMax = v2;

    if (modo === "menor") {
        evalMin = parametrosC9Global.minRef;
        evalMax = v1;
    } else if (modo === "mayor") {
        evalMin = v1;
        evalMax = parametrosC9Global.maxRef;
    }

    const pAjustada = calcularProbabilidadMuestral(evalMin, evalMax, parametrosC9Global.dist, parametrosC9Global);
    document.getElementById("c9-resultado-p").innerText = pAjustada.toFixed(4);
}
