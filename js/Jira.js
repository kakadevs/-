document.addEventListener("DOMContentLoaded", () => {
    setupDragAndDrop();
});

function setupDragAndDrop() {
    const dashboard = document.getElementById("dashboard");
    let draggedItem = null;
    let isOverTarget = false;


    dashboard.addEventListener("dragstart", (e) => {
        draggedItem = e.target;
        setTimeout(() => {
            draggedItem.style.opacity = "0.5";
        }, 0);
    });


    dashboard.addEventListener("dragend", () => {
        setTimeout(() => {
            draggedItem.style.opacity = "1";
            draggedItem = null;
        }, 0);
    });


    dashboard.querySelectorAll(".column").forEach((column) => {
        column.addEventListener("dragover", (e) => {
            e.preventDefault();
        });


        column.addEventListener("dragenter", (e) => {
            e.preventDefault();
            if (isOverTarget) return;
            column.style.border = "2px dashed #000";
            isOverTarget = true;
        });


        column.addEventListener("dragleave", () => {
            column.style.border = "";
            isOverTarget = false;
        });


        column.addEventListener("drop", (e) => {
            e.preventDefault();
            if (draggedItem !== column) {

                const allColumns = [...dashboard.querySelectorAll(".column")];
                const draggedIndex = allColumns.indexOf(draggedItem);
                const targetIndex = allColumns.indexOf(column);


                if (draggedIndex < targetIndex) {
                    dashboard.insertBefore(draggedItem, column.nextSibling);
                } else {

                    dashboard.insertBefore(draggedItem, column);
                }

                saveProjects();
            }


            column.style.border = "";
            isOverTarget = false;
        });
    });
}

function saveProjects() {
    const projects = [];
    document.querySelectorAll(".column").forEach((column) => {
        const id = parseInt(column.getAttribute("data-id"));
        const name = column.querySelector(".project-name").value;
        const task = column.querySelector(".task-input textarea").value;
        projects.push({ id, name, task });
    });
    localStorage.setItem("projects", JSON.stringify(projects));
}

function loadProjects() {
    const savedProjects = JSON.parse(localStorage.getItem("projects")) || [];
    savedProjects.forEach((project) => addProjectToDOM(project.id, project.name, project.task));
    projectCount = savedProjects.length ? savedProjects[savedProjects.length - 1].id + 1 : 1;
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
        <textarea placeholder="Escreva sua tarefa..." rows="5">${task}</textarea></div>
        <uploads placeholder="Adicione o arquivo..." rows="5">${task}</uploads></div>
        <button class="attachments-btn"><i class="fa fa-paperclip"></i>+ Anexos</button>
        <button class="add-task" onclick="openModal()">Mais informações...</button>
        <button class="delete-project" onclick="deleteProject(${id})">Excluir</button>
    `;

    document.getElementById("dashboard").appendChild(newProjectContainer);
    newProjectContainer.querySelector(".project-name").addEventListener("input", saveProjects);
    newProjectContainer.querySelector(".task-input textarea").addEventListener("input", saveProjects);
    setupDragAndDrop();
}

function deleteProject(id) {
    document.querySelector(`.column[data-id="${id}"]`).remove();
    saveProjects();
}
