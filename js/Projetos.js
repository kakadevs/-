// script.js

document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
    setupDragAndDrop();
    setupModalSystem();
    setupFileUpload();
});

function setupFileUpload() {
    document.addEventListener("change", event => {
        if (!event.target.classList.contains("file-upload")) return;

        const column = event.target.closest(".column");
        if (!column) return;

        const fileListContainer = column.querySelector(".file-list");
        if (!fileListContainer) {
            console.warn("⚠️ .file-list não encontrado para este projeto");
            return;
        }

        const files = Array.from(event.target.files);
        const projectId = column.getAttribute("data-id");
        if (!projectId) {
            console.warn("⚠️ data-id do projeto não encontrado");
            return;
        }

        // Limita até 10 arquivos
        if (fileListContainer.children.length + files.length > 10) {
            alert("Limite de 10 arquivos por projeto atingido.");
            return;
        }

        let pending = files.length;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = e => {
                const base64 = e.target.result;
                if (typeof base64 !== "string" || !base64.startsWith("data:")) {
                    console.warn("Arquivo inválido, ignorado:", file.name);
                    if (--pending === 0) saveProjects();
                    return;
                }

                const fileData = { name: file.name, base64 };
                addFileWithPreview(fileData, fileListContainer);
                updateProjectFiles(projectId, fileListContainer);

                if (--pending === 0) saveProjects();
            };
            reader.onerror = () => {
                console.error("Erro ao ler arquivo:", file.name);
                if (--pending === 0) saveProjects();
            };
            reader.readAsDataURL(file);
        });
    });
}

function addFileWithPreview({ name, base64 }, container) {
    const item = document.createElement("div");
    item.className = "file-item";

    const blob = base64ToBlob(base64);
    const url  = URL.createObjectURL(blob);

    const spanName = document.createElement("span");
    spanName.textContent = name;
    spanName.dataset.base64 = base64;
    spanName.style.cursor = "pointer";
    spanName.addEventListener("click", () => window.open(url, "_blank"));

    const btnRemove = document.createElement("span");
    btnRemove.textContent = "Remover";
    btnRemove.style.marginLeft = "10px";
    btnRemove.style.cursor = "pointer";
    btnRemove.addEventListener("click", () => {
        container.removeChild(item);
        const col = container.closest(".column");
        updateProjectFiles(col.getAttribute("data-id"), container);
        saveProjects();
    });

    item.append(spanName, btnRemove);
    container.appendChild(item);
}

function base64ToBlob(base64) {
    const [meta, data] = base64.split(",");
    const mime = meta.match(/data:([^;]+);/)[1];
    const binary = atob(data);
    const ab = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) ab[i] = binary.charCodeAt(i);
    return new Blob([ab], { type: mime });
}

function updateProjectFiles(projectId, container) {
    const files = Array.from(container.querySelectorAll(".file-item span[data-base64]"))
        .map(span => ({ name: span.textContent, base64: span.dataset.base64 }));

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const idx = projects.findIndex(p => String(p.id) === String(projectId));
    if (idx !== -1) {
        projects[idx].files = files;
        localStorage.setItem("projects", JSON.stringify(projects));
    }
}

function openModal(projectId) {
    const modal = document.getElementById("modal");
    modal.style.display = "flex";
    modal.setAttribute("data-project-id", projectId);
    loadModalContent(projectId);

    const title = document.querySelector(`.column[data-id="${projectId}"] .project-title`);
    const modalTitle = document.getElementById("modal-title");
    if (title && modalTitle) {
        modalTitle.textContent = `Detalhes: ${title.textContent}`;
    }
}

function closeModal() {
    const modal = document.getElementById("modal");
    const pid = modal.getAttribute("data-project-id");
    if (pid) saveModalData(pid);
    modal.style.display = "none";
    modal.removeAttribute("data-project-id");
}

function saveModalData(projectId) {
    const data = {
        description: document.querySelector(".description-box textarea")?.value || "",
        comment:     document.querySelector(".comment-box textarea")?.value     || "",
        priority:    document.getElementById("priority-select")?.value         || "1",
        deadline:    document.getElementById("deadline")?.value                || ""
    };
    localStorage.setItem(`modalData_${projectId}`, JSON.stringify(data));
}

function loadModalContent(projectId) {
    const saved = JSON.parse(localStorage.getItem(`modalData_${projectId}`)) || {};
    document.querySelector(".description-box textarea").value = saved.description || "";
    document.querySelector(".comment-box textarea").value     = saved.comment     || "";
    document.getElementById("priority-select").value         = saved.priority    || "1";
    document.getElementById("deadline").value                = saved.deadline    || "";
}

function setupModalSystem() {
    document.addEventListener("click", e => {
        if (e.target.classList.contains("add-task")) {
            const col = e.target.closest(".column");
            if (col) openModal(col.getAttribute("data-id"));
        }
    });

    document.querySelectorAll(".modal-close").forEach(btn =>
        btn.addEventListener("click", closeModal)
    );

    document.getElementById("modal")?.addEventListener("click", e => {
        if (e.target.id === "modal") closeModal();
    });
}

function cleanProjectModalData(projectId) {
    localStorage.removeItem(`modalData_${projectId}`);
}

function getNextProjectId() {
    const cols = [...document.querySelectorAll(".column")];
    const ids = cols.map(c => parseInt(c.getAttribute("data-id"), 10)).filter(n => !isNaN(n));
    return ids.length ? Math.max(...ids) + 1 : 1;
}

function addNewProject() {
    const id = getNextProjectId();
    addProjectToDOM(id, "", "");
    saveProjects();
}

function addProjectToDOM(id, name, task) {
    const col = document.createElement("div");
    col.className = "column";
    col.setAttribute("data-id", id);
    col.setAttribute("draggable", "true");

    col.innerHTML = `
        <div class="task-number">${id}</div>
        <div class="project-title">Projeto ${id}</div>
        <input type="text" class="project-name" placeholder="Nome do projeto..." />
        <div class="task-input">
            <textarea placeholder="Escreva sua tarefa..." rows="5"></textarea>
        </div>
        <div class="file-list tasks"></div>
        <label class="attachments-btn">+ Anexos
            <input type="file" class="file-upload" style="display:none" multiple />
        </label>
        <button class="add-task">Mais informações...</button>
        <button class="delete-project">Excluir</button>
    `;

    // set values via properties (evita injeção de HTML)
    col.querySelector(".project-name").value = name;
    col.querySelector("textarea").value     = task;

    // listeners
    col.querySelector(".project-name")
       .addEventListener("input", saveProjects);
    col.querySelector("textarea")
       .addEventListener("input", saveProjects);
    col.querySelector(".delete-project")
       .addEventListener("click", () => {
           cleanProjectModalData(id);
           col.remove();
           saveProjects();
       });

    document.getElementById("dashboard").appendChild(col);
    setupDragAndDrop();
}

function saveProjects() {
    const data = [...document.querySelectorAll(".column")].map(col => {
        const id   = parseInt(col.getAttribute("data-id"), 10);
        const name = col.querySelector(".project-name").value;
        const task = col.querySelector("textarea").value;
        const files = [...col.querySelectorAll(".file-item span[data-base64]")]
            .map(span => ({ name: span.textContent, base64: span.dataset.base64 }));
        return { id, name, task, files };
    });
    localStorage.setItem("projects", JSON.stringify(data));
}

function loadProjects() {
    const saved = JSON.parse(localStorage.getItem("projects")) || [];
    saved.forEach(proj => {
        addProjectToDOM(proj.id, proj.name, proj.task);
        const col = document.querySelector(`.column[data-id="${proj.id}"]`);
        const list = col.querySelector(".file-list");
        (proj.files || []).forEach(file => addFileWithPreview(file, list));
    });
}

function setupDragAndDrop() {
    document.querySelectorAll(".column").forEach(col => {
        col.addEventListener("dragstart", e => {
            col.classList.add("dragging");
            e.dataTransfer.setData("text/plain", col.getAttribute("data-id"));
        });
        col.addEventListener("dragover", e => {
            e.preventDefault();
            const dragEl = document.querySelector(".dragging");
            const after = getDragAfterElement(document.getElementById("dashboard"), e.clientY);
            if (!after) document.getElementById("dashboard").append(dragEl);
            else document.getElementById("dashboard").insertBefore(dragEl, after);
        });
        col.addEventListener("dragend", () => {
            col.classList.remove("dragging");
            saveProjects();
        });
    });
}

function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll(".column:not(.dragging)")];
    return els.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return (offset < 0 && offset > closest.offset)
            ? { offset, element: child }
            : closest;
    }, { offset: -Infinity }).element;
}
