document.addEventListener("DOMContentLoaded", function() {
    // DOM Elements
    const darkModeToggle = document.getElementById("darkModeToggle");
    const body = document.body;
    const yearList = document.getElementById("yearList");
    const monthGrid = document.getElementById("monthGrid");
    const notebookView = document.querySelector(".notebook-view");
    
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

    function loadAndDisplayEntries() {
        try {
            // Get entries from localStorage
            const entriesString = localStorage.getItem("entries");
            console.log("Raw entries from localStorage:", entriesString);

            let entries = [];
            if (entriesString) {
                entries = JSON.parse(entriesString);
                console.log("Parsed entries:", entries);
            }

            // Display message if no entries
            if (!entries || entries.length === 0) {
                console.log("No entries found");
                notebookView.innerHTML = `
                    <div class="no-entries">
                        <i class="fas fa-book-open"></i>
                        <p>Your journal is empty. Start writing your thoughts!</p>
                    </div>
                `;
                yearList.innerHTML = "";
                monthGrid.innerHTML = "";
                return;
            }

            // Sort entries by date (newest first)
            entries.sort((a, b) => new Date(b.date) - new Date(a.date));
            console.log("Sorted entries:", entries);

            // Display all entries initially
            displayAllEntries(entries);

            // Get unique years
            const years = [...new Set(entries.map(entry => 
                new Date(entry.date).getFullYear()
            ))].sort((a, b) => b - a);
            console.log("Available years:", years);

            // Create year buttons
            yearList.innerHTML = `
                <button class="year-button active" data-year="all">
                    All Years <span class="count">(${entries.length})</span>
                </button>
                ${years.map(year => {
                    const yearEntries = entries.filter(entry => 
                        new Date(entry.date).getFullYear() === year
                    );
                    return `
                        <button class="year-button" data-year="${year}">
                            ${year} <span class="count">(${yearEntries.length})</span>
                        </button>
                    `;
                }).join('')}
            `;

            // Add click events to year buttons
            yearList.querySelectorAll('.year-button').forEach(button => {
                button.addEventListener('click', () => {
                    yearList.querySelectorAll('.year-button').forEach(btn => 
                        btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    const selectedYear = button.dataset.year;
                    if (selectedYear === 'all') {
                        displayAllEntries(entries);
                        monthGrid.style.display = 'none';
                    } else {
                        displayMonthsForYear(parseInt(selectedYear), entries);
                    }
                });
            });
        } catch (error) {
            console.error("Error loading entries:", error);
            notebookView.innerHTML = `
                <div class="no-entries">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Error loading your entries. Please try refreshing the page.</p>
                </div>
            `;
        }
    }

    function displayAllEntries(entries) {
        try {
            monthGrid.style.display = 'none';
            notebookView.innerHTML = `
                <div class="month-header">
                    <h2>All Thoughts</h2>
                    <p>${entries.length} thought${entries.length !== 1 ? 's' : ''}</p>
                </div>
            `;

            entries.forEach(entry => {
                const entryCard = createEntryCard(entry);
                notebookView.appendChild(entryCard);
            });
        } catch (error) {
            console.error("Error displaying all entries:", error);
        }
    }

    function displayMonthsForYear(year, entries) {
        try {
            monthGrid.style.display = 'grid';
            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            const yearEntries = entries.filter(entry => 
                new Date(entry.date).getFullYear() === year
            );

            monthGrid.innerHTML = months.map((monthName, index) => {
                const monthEntries = yearEntries.filter(entry => 
                    new Date(entry.date).getMonth() === index
                );
                const hasEntries = monthEntries.length > 0;
                return `
                    <button class="month-button ${hasEntries ? 'has-entries' : ''}" 
                            data-month="${index}" 
                            ${!hasEntries ? 'disabled' : ''}>
                        <span class="month-name">${monthName}</span>
                        <span class="entry-count">
                            ${monthEntries.length} thought${monthEntries.length !== 1 ? 's' : ''}
                        </span>
                    </button>
                `;
            }).join('');

            // Add click events to month buttons
            monthGrid.querySelectorAll('.month-button.has-entries').forEach(button => {
                button.addEventListener('click', () => {
                    monthGrid.querySelectorAll('.month-button').forEach(btn => 
                        btn.classList.remove('active'));
                    button.classList.add('active');
                    displayEntriesForMonth(year, parseInt(button.dataset.month), entries);
                });
            });

            // Show first month with entries by default
            const firstMonthWithEntries = monthGrid.querySelector('.month-button.has-entries');
            if (firstMonthWithEntries) {
                firstMonthWithEntries.click();
            } else {
                notebookView.innerHTML = `
                    <div class="no-entries">
                        <i class="fas fa-book-open"></i>
                        <p>No thoughts recorded for ${year}</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error("Error displaying months:", error);
        }
    }

    function displayEntriesForMonth(year, month, entries) {
        try {
            const monthEntries = entries.filter(entry => {
                const entryDate = new Date(entry.date);
                return entryDate.getFullYear() === year && 
                       entryDate.getMonth() === month;
            }).sort((a, b) => new Date(b.date) - new Date(a.date));

            const months = [
                "January", "February", "March", "April", "May", "June",
                "July", "August", "September", "October", "November", "December"
            ];

            notebookView.innerHTML = `
                <div class="month-header">
                    <h2>${months[month]} ${year}</h2>
                    <p>${monthEntries.length} thought${monthEntries.length !== 1 ? 's' : ''}</p>
                </div>
            `;

            monthEntries.forEach(entry => {
                const entryCard = createEntryCard(entry);
                notebookView.appendChild(entryCard);
            });
        } catch (error) {
            console.error("Error displaying entries for month:", error);
        }
    }

    function createEntryCard(entry) {
        try {
            const entryCard = document.createElement('div');
            entryCard.classList.add('entry-card');
            
            const entryDate = new Date(entry.date);
            const formattedDate = entryDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            const moodEmoji = getMoodEmoji(entry.mood);
            
            entryCard.innerHTML = `
                <div class="entry-header">
                    <div class="entry-date">${formattedDate}</div>
                    <div class="entry-mood">${moodEmoji} ${entry.mood}</div>
                </div>
                <div class="entry-content">
                    <h3 class="entry-title">${entry.title || 'Untitled'}</h3>
                    <p>${entry.content}</p>
                </div>
            `;
            
            return entryCard;
        } catch (error) {
            console.error("Error creating entry card:", error);
            return null;
        }
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

    // Initialize the display
    loadAndDisplayEntries();

    // Add storage event listener to update when entries change
    window.addEventListener('storage', function(e) {
        if (e.key === 'entries') {
            console.log("Storage event triggered for entries");
            loadAndDisplayEntries();
        }
    });

    // Add manual refresh button
    const refreshButton = document.createElement('button');
    refreshButton.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
    refreshButton.classList.add('refresh-button');
    refreshButton.addEventListener('click', () => {
        console.log("Manual refresh triggered");
        loadAndDisplayEntries();
    });
    document.querySelector('.archive-hero').appendChild(refreshButton);

    // Add auto-refresh every 30 seconds
    setInterval(() => {
        console.log("Auto-refresh triggered");
        loadAndDisplayEntries();
    }, 30000);
}); 