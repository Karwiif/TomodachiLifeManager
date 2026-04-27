let todasLasIslas = JSON.parse(localStorage.getItem('mis_islas_tomodachi')) || {};
let nombreIslaActual = "";
let datos = { residentes: [], categorias: ["General"] };

const pantallaInicio = document.getElementById('pantalla-inicio');
const pantallaGestion = document.getElementById('pantalla-gestion');
const contadorTxt = document.getElementById('contador');
const listaDiv = document.getElementById('listaResidentes');
const comboCat = document.getElementById('selectCategoria');
const errorMsg = document.getElementById('mensaje-error');
const barraProgreso = document.getElementById('barra-progreso');

window.onload = actualizarMenuInicial;

function actualizarMenuInicial() {
    const contenedorMenu = document.querySelector('.menu-inicial');
    if (!contenedorMenu) return;
    const nombres = Object.keys(todasLasIslas);
    
    let htmlIslas = "<h3>Your saved Islands:</h3>";
    
    if (nombres.length === 0) {
        htmlIslas += "<p class='vacio'>No islands in memory.</p>";
    } else {
        nombres.forEach(nombre => {
            htmlIslas += `
                <div class="isla-row" style="display:flex; gap:10px; margin-bottom:10px; align-items:center;">
                    <button class="btn-main last-session" style="flex-grow:1; margin:0;" onclick="cargarIsla('${nombre}')">🏝️ ${nombre}</button>
                    <button class="btn-edit" style="padding: 15px;" onclick="renombrarIslaDesdeMenu('${nombre}')">✎</button>
                    <button class="btn-del" style="padding: 15px;" onclick="borrarIslaDeCache('${nombre}')">✘</button>
                </div>
            `;
        });
    }

    const botonesFijos = `
        <hr>
        <button class="btn-main" onclick="pedirNombreNuevaIsla()">✨ Create New Island</button>
        <label class="btn-main secondary" style="cursor: pointer; text-align: center; display: block; margin-top:10px;">
            📁 Import JSON as New Island
            <input type="file" id="importFile" accept=".json" onchange="importarJSON(event)" style="display: none;">
        </label>
    `;
    
    contenedorMenu.innerHTML = htmlIslas + botonesFijos;
}

function pedirNombreNuevaIsla() {
    const nombre = prompt("What name will you give to your new island?");
    if (nombre && nombre.trim() !== "") {
        const nombreLimpio = nombre.trim();
        if (todasLasIslas[nombreLimpio]) {
            alert("An island with that name already exists.");
            return;
        }
        nombreIslaActual = nombreLimpio;
        datos = { residentes: [], categorias: ["General"] };
        guardarEnCache();
        entrarAGestion();
    }
}

function renombrarIslaDesdeMenu(oldName) {
    const newName = prompt("Enter the new name for the island:", oldName);
    if (newName && newName.trim() !== "" && newName !== oldName) {
        const nombreLimpio = newName.trim();
        if (todasLasIslas[nombreLimpio]) {
            alert("An island with that name already exists.");
            return;
        }
        todasLasIslas[nombreLimpio] = todasLasIslas[oldName];
        delete todasLasIslas[oldName];
        localStorage.setItem('mis_islas_tomodachi', JSON.stringify(todasLasIslas));
        actualizarMenuInicial();
    }
}

function renombrarIsla() {
    renombrarIslaDesdeMenu(nombreIslaActual);
    document.getElementById('nombre-isla-titulo').innerText = "Island: " + nombreIslaActual;
}

function cargarIsla(nombre) {
    nombreIslaActual = nombre;
    datos = todasLasIslas[nombre];
    entrarAGestion();
}

function borrarIslaDeCache(nombre) {
    if (confirm(`Are you sure you want to PERMANENTLY delete the island "${nombre}"?`)) {
        delete todasLasIslas[nombre];
        localStorage.setItem('mis_islas_tomodachi', JSON.stringify(todasLasIslas));
        actualizarMenuInicial();
    }
}

function entrarAGestion() {
    pantallaInicio.style.display = 'none';
    pantallaGestion.style.display = 'block';
    document.getElementById('nombre-isla-titulo').innerText = "Island: " + nombreIslaActual;
    render();
}

function guardarEnCache() {
    todasLasIslas[nombreIslaActual] = datos;
    localStorage.setItem('mis_islas_tomodachi', JSON.stringify(todasLasIslas));
    render();
}

function exportarJSON() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(datos, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${nombreIslaActual}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

function importarJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const contenido = JSON.parse(e.target.result);
            const nombreSugerido = file.name.replace(".json", "");
            const nombre = prompt("Name for this imported island:", nombreSugerido);
            if (nombre && nombre.trim() !== "") {
                todasLasIslas[nombre.trim()] = contenido;
                localStorage.setItem('mis_islas_tomodachi', JSON.stringify(todasLasIslas));
                actualizarMenuInicial();
                alert("Island imported successfully!");
            }
        } catch (err) { alert("Error: The file is not a valid JSON."); }
    };
    reader.readAsText(file);
}

function añadirResidente() {
    const nombreInput = document.getElementById('nombreMii');
    const nombre = nombreInput.value.trim();
    if (datos.residentes.length >= 70) {
        errorMsg.innerText = "70 residents limit reached!";
        return;
    }
    if (nombre) {
        datos.residentes.push({ nombre, categoria: comboCat.value, hecho: false });
        nombreInput.value = '';
        errorMsg.innerText = "";
        guardarEnCache();
    }
}

function editarResidente(idx) {
    const r = datos.residentes[idx];
    document.getElementById('nombreMii').value = r.nombre;
    comboCat.value = r.categoria;
    datos.residentes.splice(idx, 1);
    document.getElementById('nombreMii').focus();
    render();
}

function borrarResidente(idx) {
    if (confirm("Delete this resident?")) {
        datos.residentes.splice(idx, 1);
        guardarEnCache();
    }
}

function crearCategoria() {
    const input = document.getElementById('nuevaCatNombre');
    const nombre = input.value.trim();
    if (nombre && !datos.categorias.includes(nombre)) {
        datos.categorias.push(nombre);
        input.value = '';
        guardarEnCache();
    }
}

function editarCategoria(oldName) {
    if (oldName === "General") return;
    const newName = prompt("New name for the category:", oldName);
    if (newName && newName.trim() !== "" && !datos.categorias.includes(newName)) {
        const index = datos.categorias.indexOf(oldName);
        datos.categorias[index] = newName;
        datos.residentes.forEach(r => { if (r.categoria === oldName) r.categoria = newName; });
        guardarEnCache();
    }
}

function borrarCategoria(catName) {
    if (catName === "General") return;
    if (confirm(`Delete "${catName}"? Residents will be moved to "General".`)) {
        datos.residentes.forEach(r => { if (r.categoria === catName) r.categoria = "General"; });
        datos.categorias = datos.categorias.filter(c => c !== catName);
        guardarEnCache();
    }
}

function render() {
    const total = datos.residentes.length;
    contadorTxt.innerText = total;

    const porcentaje = (total / 70) * 100;
    if (barraProgreso) {
        barraProgreso.style.width = porcentaje + "%";
        if (total >= 70) barraProgreso.style.backgroundColor = "#e74c3c";
        else if (total >= 55) barraProgreso.style.backgroundColor = "#f1c40f";
        else barraProgreso.style.backgroundColor = "#27ae60";
    }

    comboCat.innerHTML = datos.categorias.map(c => `<option value="${c}">${c}</option>`).join('');

    const generarListaHTML = (soloHechos) => {
        return datos.categorias.map(cat => {
            const miisHtml = datos.residentes.map((r, i) => {
                if (r.categoria !== cat || r.hecho !== soloHechos) return null;
                return `
                    <div class="resident-item">
                        <span>${r.nombre}</span>
                        <div class="acciones">
                            <button class="btn-done" onclick="toggleHecho(${i})">${soloHechos ? '↩' : '✓'}</button>
                            <button class="btn-edit" onclick="editarResidente(${i})">✎</button>
                            <button class="btn-del" onclick="borrarResidente(${i})">✘</button>
                        </div>
                    </div>`;
            }).filter(m => m !== null).join('');

            if (miisHtml === "") return ""; 
            return `
                <div class="categoria-section" style="margin-top: 10px; padding: 10px;">
                    <h4 style="margin:0 0 5px 0; font-size: 0.8em; color: #7f8c8d;">${cat}</h4>
                    ${miisHtml}
                </div>`;
        }).join('');
    };

    document.getElementById('listaPlanificados').innerHTML = generarListaHTML(false) || '<p class="vacio">No planned Miis</p>';
    document.getElementById('listaHechos').innerHTML = generarListaHTML(true) || '<p class="vacio">Nothing finished yet</p>';
}

function toggleHecho(idx) {
    datos.residentes[idx].hecho = !datos.residentes[idx].hecho;
    guardarEnCache();
}
