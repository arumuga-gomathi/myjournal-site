document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;
    const journalForm = document.getElementById("journalForm");
    const journalContainer = document.getElementById("journal-entries");
    const searchInput = document.getElementById("searchEntries");
    const sortSelect = document.getElementById("sortEntries");
    const entryCountElement = document.getElementById("entryCount");
    const wordCountElement = document.getElementById("wordCount");
    
    // Load dark mode preference
    if (localStorage.getItem("darkMode") === "enabled") {
        body.classList.add("dark-mode");
        darkModeToggle.textContent = "☀️";
    }

    // Toggle Dark Mode
    darkModeToggle.addEventListener("click", () => {
        body.classList.toggle("dark-mode");
        if (body.classList.contains("dark-mode")) {
            localStorage.setItem("darkMode", "enabled");
            darkModeToggle.textContent = "☀️";
        } else {
            localStorage.setItem("darkMode", "disabled");
            darkModeToggle.textContent = "🌙";
        }
    });

    // Journal Entries Management
    let journalEntries = JSON.parse(localStorage.getItem("entries")) || [];

    function updateStats() {
        entryCountElement.textContent = journalEntries.length;
        const totalWords = journalEntries.reduce((count, entry) => {
            return count + entry.content.split(/\s+/).filter(word => word.length > 0).length;
        }, 0);
        wordCountElement.textContent = totalWords;
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function createEntryElement(entry) {
        const entryDiv = document.createElement("div");
        entryDiv.classList.add("entry");
        entryDiv.innerHTML = `
            <div class="entry-header">
                <h3>${entry.title}</h3>
                <span class="entry-date">${formatDate(entry.date)}</span>
            </div>
            <p>${entry.content}</p>
            <div class="entry-actions">
                <button class="delete-entry" data-id="${entry.id}">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="edit-entry" data-id="${entry.id}">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;

        // Add event listeners for delete and edit buttons
        entryDiv.querySelector(".delete-entry").addEventListener("click", () => deleteEntry(entry.id));
        entryDiv.querySelector(".edit-entry").addEventListener("click", () => editEntry(entry.id));

        return entryDiv;
    }

    function displayEntries(entries = journalEntries) {
        journalContainer.innerHTML = "";
        if (entries.length === 0) {
            journalContainer.innerHTML = `
                <div class="no-entries">
                    <i class="fas fa-book-open"></i>
                    <p>No entries yet. Start writing your first entry!</p>
                </div>
            `;
            return;
        }
        entries.forEach(entry => {
            journalContainer.appendChild(createEntryElement(entry));
        });
        updateStats();
    }

    function deleteEntry(id) {
        if (confirm("Are you sure you want to delete this entry?")) {
            journalEntries = journalEntries.filter(entry => entry.id !== id);
            localStorage.setItem("entries", JSON.stringify(journalEntries));
            displayEntries();
        }
    }

    function editEntry(id) {
        const entry = journalEntries.find(entry => entry.id === id);
        if (entry) {
            document.getElementById("entryTitle").value = entry.title;
            document.getElementById("entryContent").value = entry.content;
            document.getElementById("entryDate").value = entry.date;
            document.getElementById("addEntry").textContent = "Update Entry";
            journalForm.dataset.editId = id;
        }
    }

    // Search functionality
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredEntries = journalEntries.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm) ||
            entry.content.toLowerCase().includes(searchTerm)
        );
        displayEntries(filteredEntries);
    });

    // Sort functionality
    sortSelect.addEventListener("change", (e) => {
        const sortedEntries = [...journalEntries].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return e.target.value === "newest" ? dateB - dateA : dateA - dateB;
        });
        displayEntries(sortedEntries);
    });

    // Form submission
    journalForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const title = document.getElementById("entryTitle").value;
        const content = document.getElementById("entryContent").value;
        const date = document.getElementById("entryDate").value;
        
        if (journalForm.dataset.editId) {
            // Update existing entry
            const id = journalForm.dataset.editId;
            const index = journalEntries.findIndex(entry => entry.id === id);
            if (index !== -1) {
                journalEntries[index] = { id, title, content, date };
            }
            delete journalForm.dataset.editId;
            document.getElementById("addEntry").innerHTML = '<i class="fas fa-plus"></i> Add Entry';
        } else {
            // Add new entry
            const newEntry = {
                id: Date.now().toString(),
                title,
                content,
                date
            };
            journalEntries.unshift(newEntry);
        }

        localStorage.setItem("entries", JSON.stringify(journalEntries));
        journalForm.reset();
        displayEntries();

        // Show success message
        const successMessage = document.createElement("div");
        successMessage.classList.add("success-message");
        successMessage.textContent = "Entry saved successfully!";
        journalForm.appendChild(successMessage);
        setTimeout(() => successMessage.remove(), 3000);
    });

    // Initial display
    displayEntries();
});
