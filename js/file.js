document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("file-upload").addEventListener("change", function (event) {
        const fileList = event.target.files;
        const fileListContainer = document.getElementById("file-list");

        Array.from(fileList).forEach(file => {
            const listItem = document.createElement("li");
            listItem.style.display = "block";
            listItem.style.marginBottom = "5px";
            listItem.style.padding = "8px";
            listItem.style.background = "#f8f9fa";
            listItem.style.borderLeft = "3px solid #007bff";
            listItem.style.borderRadius = "5px";
            listItem.style.display = "flex";
            listItem.style.justifyContent = "space-between";
            listItem.style.alignItems = "center";

            const fileName = document.createElement("span");
            fileName.textContent = file.name;
            fileName.style.color = "#000";
            fileName.style.fontWeight = "bold";
            fileName.style.cursor = "pointer";

            
            const fileURL = URL.createObjectURL(file);

            
            fileName.addEventListener("click", function () {
                window.open(fileURL, '_blank');
            });

            const removeButton = document.createElement("span");
            removeButton.textContent = "Remover";
            removeButton.style.color = "#dc3545";
            removeButton.style.cursor = "pointer";
            removeButton.style.marginLeft = "10px";
            removeButton.addEventListener("click", function () {
                fileListContainer.removeChild(listItem);
                URL.revokeObjectURL(fileURL);
            });

            listItem.appendChild(fileName);
            listItem.appendChild(removeButton);
            fileListContainer.appendChild(listItem);
        });
    });
});