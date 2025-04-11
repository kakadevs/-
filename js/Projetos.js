document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
    setupDragAndDrop();
    setupModalSystem();
    setupFileUpload();
});

function setupFileUpload() {
    document.addEventListener("change", function (event) {
        if (event.target.classList.contains("file-upload")) {
            const column = event.target.closest(".column");
            const fileListContainer = column.querySelector(".file-list");
            const files = Array.from(event.target.files);
            const id = column.getAttribute("data-id");

            let pending = files.length;

            files.forEach(file => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    const fileData = {
                        name: file.name,
                        base64: e.target.result
                    };
                    addFileWithPreview(fileData, fileListContainer);
                    updateProjectFiles(id, fileListContainer);
                    pending--;
                    if (pending === 0) saveProjects();
                };
                reader.readAsDataURL(file);
            });
        }
    });
}

function addFileWithPreview(fileData, container) {
    const { name, base64 } = fileData;

    const listItem = document.createElement("div");
    listItem.className = "file-item";

    const fileBlob = base64ToBlob(base64);
    const fileURL = URL.createObjectURL(fileBlob);

    const fileName = document.createElement("span");
    fileName.textContent = name;
    fileName.style.cursor = "pointer";
    fileName.dataset.base64 = base64;
    fileName.addEventListener("click", () => window.open(fileURL, '_blank'));

    const removeButton = document.createElement("span");
    removeButton.textContent = "Remover";
    removeButton.addEventListener("click", () => {
        container.removeChild(listItem);
        const column = container.closest(".column");
        updateProjectFiles(column.getAttribute("data-id"), container);
        saveProjects();
    });

    listItem.appendChild(fileName);
    listItem.appendChild(removeButton);
    container.appendChild(listItem);
}

function base64ToBlob(base64) {
    const byteString = atob(base64.split(',')[1]);
    const mimeString = base64.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
}

function updateProjectFiles(projectId, container) {
    const fileItems = container.querySelectorAll(".file-item");
    const files = Array.from(fileItems).map(item => {
        const span = item.querySelector("span");
        return {
            name: span.textContent,
            base64: span.dataset.base64
        };
    });

    const projects = JSON.parse(localStorage.getItem("projects")) || [];
    const index = projects.findIndex(p => p.id == projectId);
    if (index !== -1) {
        projects[index].files = files;
        localStorage.setItem("projects", JSON.stringify(projects));
    }
}

function openModal(projectId) {
    const modal = document.getElementById("modal");
    modal.style.display = "flex";
    modal.setAttribute("data-project-id", projectId);
    loadModalContent(projectId);

    const projectTitle = document.querySelector(`.column[data-id="${projectId}"] .project-title`);
    const modalTitle = document.getElementById("modal-title");
    if (modalTitle && projectTitle) {
        modalTitle.textContent = `Detalhes: ${projectTitle.textContent}`;
    }
}

function closeModal() {
    const modal = document.getElementById("modal");
    if (!modal) return;

    const projectId = modal.getAttribute("data-project-id");
    if (projectId) {
        saveModalData(projectId);
    }

    modal.style.display = "none";
    modal.removeAttribute("data-project-id");
}

function saveModalData(projectId) {
    const modal = document.getElementById("modal");
    if (!modal) return;

    const data = {
        description: document.querySelector(".description-box textarea")?.value || "",
        comment: document.querySelector(".comment-box textarea")?.value || "",
        priority: document.getElementById("priority-select")?.value || "1",
        deadline: document.getElementById("deadline")?.value || "",
    };

    localStorage.setItem(`modalData_${projectId}`, JSON.stringify(data));
}

function loadModalContent(projectId) {
    const savedData = JSON.parse(localStorage.getItem(`modalData_${projectId}`)) || {};

    setValue(".description-box textarea", savedData.description);
    setValue(".comment-box textarea", savedData.comment);
    setValue("#priority-select", savedData.priority);
    setValue("#deadline", savedData.deadline);
}

function setValue(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.value = value || "";
}

function setupModalSystem() {
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('add-task')) {
            const project = e.target.closest('.column');
            if (project?.hasAttribute('data-id')) {
                openModal(project.getAttribute('data-id'));
            }
        }
    });

    const closeBtn = document.querySelector(".modal-close");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    const modal = document.getElementById("modal");
    if (modal) {
        modal.addEventListener("click", (e) => {
            if (e.target === modal) closeModal();
        });
    }
}

function cleanProjectModalData(projectId) {
    localStorage.removeItem(`modalData_${projectId}`);
}

function getNextProjectId() {
    const columns = document.querySelectorAll(".column");
    const ids = Array.from(columns).map(col => parseInt(col.getAttribute("data-id")));
    return ids.length ? Math.max(...ids) + 1 : 1;
}

function addNewProject() {
    const id = getNextProjectId();
    addProjectToDOM(id, "", "");
    saveProjects();
}

function addProjectToDOM(id, name, task) {
    const newProjectContainer = document.createElement("div");
    newProjectContainer.classList.add("column");
    newProjectContainer.setAttribute("data-id", id);
    newProjectContainer.setAttribute("draggable", "true");

    newProjectContainer.innerHTML = `
        <div class="task-number">${id}</div>
        <div class="project-title">Projeto ${id}</div>
        <input type="text" class="project-name" placeholder="Nome do projeto..." value="${name}">
        <div class="task-input">
            <textarea placeholder="Escreva sua tarefa..." rows="5">${task}</textarea>
        </div>
        <div class="file-list tasks"></div>
        <label class="attachments-btn">+ Anexos
            <input type="file" class="file-upload" style="display:none" multiple />
        </label>
        <button class="add-task">Mais informações...</button>
        <button class="delete-project" onclick="deleteProject(${id})">Excluir</button>
    `;

    document.getElementById("dashboard").appendChild(newProjectContainer);
    newProjectContainer.querySelector(".project-name").addEventListener("input", saveProjects);
    newProjectContainer.querySelector(".task-input textarea").addEventListener("input", saveProjects);
    setupDragAndDrop();
}

function deleteProject(id) {
    document.querySelector(`.column[data-id="${id}"]`).remove();
    cleanProjectModalData(id);
    saveProjects();
}

function saveProjects() {
    const projects = [];
    document.querySelectorAll(".column").forEach(column => {
        const id = parseInt(column.getAttribute("data-id"));
        const name = column.querySelector(".project-name").value;
        const task = column.querySelector(".task-input textarea").value;
        const files = Array.from(column.querySelectorAll(".file-item span:first-child")).map(span => ({
            name: span.textContent,
            base64: span.dataset.base64
        }));
        projects.push({ id, name, task, files });
    });
    localStorage.setItem("projects", JSON.stringify(projects));
}

function loadProjects() {
    const savedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    savedProjects.forEach(project => {
        addProjectToDOM(project.id, project.name, project.task);
        const column = document.querySelector(`.column[data-id="${project.id}"]`);
        const fileListContainer = column.querySelector(".file-list");
        if (Array.isArray(project.files)) {
            project.files.forEach(file => {
                addFileWithPreview(file, fileListContainer);
            });
        }
    });
}

function setupDragAndDrop() {
    const columns = document.querySelectorAll(".column");
    columns.forEach(column => {
        column.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", column.dataset.id);
            column.classList.add("dragging");
        });

        column.addEventListener("dragover", (e) => {
            e.preventDefault();
            const draggingElement = document.querySelector(".dragging");
            const dashboard = document.getElementById("dashboard");
            const afterElement = getDragAfterElement(dashboard, e.clientY);
            if (afterElement == null) {
                dashboard.appendChild(draggingElement);
            } else {
                dashboard.insertBefore(draggingElement, afterElement);
            }
        });

        column.addEventListener("dragend", () => {
            column.classList.remove("dragging");
            saveProjects();
        });
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".column:not(.dragging)")];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}
