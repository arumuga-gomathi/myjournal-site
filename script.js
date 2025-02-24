document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;
    const form = document.getElementById("journalForm");
    const entryCountElement = document.getElementById("entryCount");
    const wordCountElement = document.getElementById("wordCount");
    const journalEntriesContainer = document.getElementById("journal-entries");
    const searchInput = document.getElementById("searchEntries");
    const sortSelect = document.getElementById("sortEntries");
    const photoInput = document.getElementById("entryPhotos");
    const photoPreview = document.getElementById("photoPreview");

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

    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    document.getElementById("entryDate").value = today;

    // Initialize entries array
    let entries = [];
    
    // Load existing entries from localStorage
    function loadEntries() {
        const savedEntries = localStorage.getItem("entries");
        if (savedEntries) {
            try {
                entries = JSON.parse(savedEntries);
                console.log("Loaded entries:", entries);
            } catch (error) {
                console.error("Error loading entries:", error);
                entries = [];
            }
        }
        updateStats();
        displayEntries(entries);
    }

    // Load entries on page load
    loadEntries();

    // Handle form submission
    form.addEventListener("submit", function(e) {
        e.preventDefault();

        // Get form values
        const title = document.getElementById("entryTitle").value.trim();
        const content = document.getElementById("entryContent").value.trim();
        const date = document.getElementById("entryDate").value;
        const mood = document.getElementById("entryMood").value;

        if (!title || !content || !date || !mood) {
            showNotification("Please fill in all required fields!");
            return;
        }

        // Create new entry object
        const newEntry = {
            id: Date.now(),
            title: title,
            content: content,
            date: date,
            mood: mood,
            photos: currentPhotos,
            timestamp: new Date().toISOString()
        };

        console.log("Creating new entry:", newEntry);

        // Add new entry to the beginning of the array
        entries.unshift(newEntry);
        
        // Save to localStorage
        try {
            localStorage.setItem("entries", JSON.stringify(entries));
            console.log("Saved entries to localStorage:", entries);
            
            // Update UI
            updateStats();
            displayEntries(entries);

            // Reset form and photos
            form.reset();
            document.getElementById("entryDate").value = today;
            photoPreview.innerHTML = "";
            currentPhotos = [];

            // Show success message
            showNotification("Thought saved successfully!");

            // Scroll to entries section
            document.getElementById("entries").scrollIntoView({ behavior: "smooth" });
        } catch (error) {
            console.error("Error saving entry:", error);
            showNotification("Error saving your thought. Please try again.");
        }
    });

    // Handle search
    searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (searchTerm === "") {
            displayEntries(entries);
            return;
        }
        const filteredEntries = entries.filter(entry => 
            entry.title.toLowerCase().includes(searchTerm) ||
            entry.content.toLowerCase().includes(searchTerm)
        );
        displayEntries(filteredEntries);
    });

    // Handle sort
    sortSelect.addEventListener("change", (e) => {
        const sortedEntries = [...entries].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return e.target.value === "newest" ? dateB - dateA : dateA - dateB;
        });
        displayEntries(sortedEntries);
    });

    function updateStats() {
        // Update entry count
        entryCountElement.textContent = entries.length;

        // Calculate total words
        const totalWords = entries.reduce((total, entry) => {
            return total + entry.content.trim().split(/\s+/).filter(word => word.length > 0).length;
        }, 0);
        wordCountElement.textContent = totalWords;
    }

    function displayEntries(entriesToShow) {
        journalEntriesContainer.innerHTML = "";
        
        if (!entriesToShow || entriesToShow.length === 0) {
            journalEntriesContainer.innerHTML = `
                <div class="no-entries">
                    <i class="fas fa-book-open"></i>
                    <p>Start writing your first thought!</p>
                </div>
            `;
            return;
        }

        entriesToShow.forEach(entry => {
            if (!entry || !entry.date) return;

            const entryCard = document.createElement("div");
            entryCard.classList.add("entry");
            
            const entryDate = new Date(entry.date);
            const formattedDate = entryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const moodEmoji = getMoodEmoji(entry.mood);
            
            let photosHtml = '';
            if (entry.photos && entry.photos.length > 0) {
                photosHtml = `
                    <div class="entry-photos">
                        ${entry.photos.map((photo, index) => `
                            <div class="entry-photo">
                                <img src="${photo}" alt="Photo ${index + 1}">
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            entryCard.innerHTML = `
                <div class="entry-header" role="button" tabindex="0">
                    <div class="entry-summary">
                        <div class="entry-date">${formattedDate}</div>
                        <div class="entry-mood">${moodEmoji} ${entry.mood}</div>
                        <h3 class="entry-title">${entry.title}</h3>
                    </div>
                    <div class="entry-toggle">
                        <i class="fas fa-chevron-down"></i>
                    </div>
                </div>
                <div class="entry-content" style="display: none;">
                    <p>${entry.content}</p>
                    ${photosHtml}
                    <div class="entry-actions">
                        <button class="delete-entry" data-id="${entry.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            
            // Add toggle functionality
            const header = entryCard.querySelector('.entry-header');
            const content = entryCard.querySelector('.entry-content');
            const toggle = entryCard.querySelector('.entry-toggle i');
            
            header.addEventListener('click', () => {
                const isHidden = content.style.display === 'none';
                content.style.display = isHidden ? 'block' : 'none';
                toggle.className = isHidden ? 'fas fa-chevron-up' : 'fas fa-chevron-down';
                if (isHidden) {
                    entryCard.classList.add('expanded');
                } else {
                    entryCard.classList.remove('expanded');
                }
            });

            // Add keyboard accessibility
            header.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    header.click();
                }
            });

            // Add photo click functionality
            const photos = entryCard.querySelectorAll('.entry-photo');
            photos.forEach(photo => {
                photo.addEventListener('click', (e) => {
                    e.stopPropagation(); // Prevent entry toggle when clicking photo
                    const imgSrc = photo.querySelector('img').src;
                    const modal = document.createElement('div');
                    modal.classList.add('photo-modal');
                    modal.innerHTML = `
                        <span class="modal-close">&times;</span>
                        <img src="${imgSrc}" alt="Full size photo">
                    `;
                    document.body.appendChild(modal);

                    // Add close functionality
                    const closeBtn = modal.querySelector('.modal-close');
                    closeBtn.addEventListener('click', () => modal.remove());
                    modal.addEventListener('click', (e) => {
                        if (e.target === modal) modal.remove();
                    });
                });
            });
            
            // Add delete functionality
            entryCard.querySelector(".delete-entry").addEventListener("click", (e) => {
                e.stopPropagation(); // Prevent entry toggle when clicking delete
                if (confirm("Are you sure you want to delete this entry?")) {
                    entries = entries.filter(e => e.id !== entry.id);
                    localStorage.setItem("entries", JSON.stringify(entries));
                    updateStats();
                    displayEntries(entries);
                    showNotification("Entry deleted successfully!");
                }
            });

            journalEntriesContainer.appendChild(entryCard);
        });
    }

    function getMoodEmoji(mood) {
        const moodEmojis = {
            happy: "😊",
            excited: "🎉",
            calm: "😌",
            sad: "😢",
            angry: "😠",
            neutral: "😐"
        };
        return moodEmojis[mood?.toLowerCase()] || "📝";
    }

    function showNotification(message) {
        const notification = document.createElement("div");
        notification.classList.add("notification");
        notification.textContent = message;
        document.body.appendChild(notification);

        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Debug function to check localStorage
    function checkLocalStorage() {
        const entriesString = localStorage.getItem("entries");
        console.log("Current localStorage entries:", entriesString);
        try {
            const parsedEntries = JSON.parse(entriesString);
            console.log("Parsed entries:", parsedEntries);
        } catch (error) {
            console.error("Error parsing entries:", error);
        }
    }

    // Check localStorage on page load
    checkLocalStorage();

    // Add a test entry button for debugging
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        const testButton = document.createElement('button');
        testButton.textContent = 'Add Test Entry';
        testButton.style.position = 'fixed';
        testButton.style.bottom = '20px';
        testButton.style.right = '20px';
        testButton.addEventListener('click', () => {
            const testEntry = {
                id: Date.now(),
                title: 'Test Entry',
                content: 'This is a test entry',
                date: new Date().toISOString().split('T')[0],
                mood: 'happy'
            };
            entries.unshift(testEntry);
            localStorage.setItem("entries", JSON.stringify(entries));
            updateStats();
            displayEntries(entries);
            checkLocalStorage();
        });
        document.body.appendChild(testButton);
    }

    // Add photo preview functionality
    photoInput.addEventListener("change", function(e) {
        const files = Array.from(e.target.files);
        
        if (files.length > 5) {
            showNotification("You can only upload up to 5 photos!");
            return;
        }

        // Clear existing previews
        photoPreview.innerHTML = "";
        currentPhotos = [];

        files.forEach(file => {
            if (!file.type.startsWith('image/')) {
                showNotification("Please upload only image files!");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                const previewItem = document.createElement("div");
                previewItem.classList.add("photo-preview-item");
                
                previewItem.innerHTML = `
                    <img src="${e.target.result}" alt="Preview">
                    <button class="remove-photo" onclick="this.parentElement.remove();">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                photoPreview.appendChild(previewItem);
                currentPhotos.push(e.target.result);
            };
            reader.readAsDataURL(file);
        });
    });
});
