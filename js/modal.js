document.addEventListener("DOMContentLoaded", () => {
    loadProjects();
    setupDragAndDrop();
    setupModalSystem();
});

let projectCount = 1;

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
        deadline: document.getElementById("deadline")?.value || ""
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
}

function cleanProjectModalData(projectId) {
    localStorage.removeItem(`modalData_${projectId}`);
}

function addNewProject() {
    addProjectToDOM(projectCount, "", "");
    projectCount++;
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
        <div class="task-input"><textarea placeholder="Escreva sua tarefa..." rows="5">${task}</textarea></div>
        <div class="file-list"></div>
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
        projects.push({ id, name, task });
    });
    localStorage.setItem("projects", JSON.stringify(projects));
}

function loadProjects() {
    const savedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    savedProjects.forEach(project => addProjectToDOM(project.id, project.name, project.task));
    projectCount = savedProjects.length ? savedProjects[savedProjects.length - 1].id + 1 : 1;
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