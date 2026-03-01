// DATA STORE & STATE
let studentList = [];
let activeFilter = "all";
let sortConfig = { field: null, direction: "asc" };
let searchQuery = "";
let editingId = null;

// LOCALSTORAGE FUNCTIONS

//Save data to localStorage
function saveToStorage() {
  localStorage.setItem("gradeManager_students", JSON.stringify(studentList));
}

// Load data from localStorage when app open
function loadFromStorage() {
  const saved = localStorage.getItem("gradeManager_students");
  if (saved) {
    studentList = JSON.parse(saved);
  }
}

// CORE FUNCTIONS
function addStudent() {
  const name = document.getElementById("inputName").value.trim();
  const scoreInput = document.getElementById("inputScore").value;
  const score = parseFloat(scoreInput);
  const errorEl = document.getElementById("errorMessage");

  // Validation
  if (!name) {
    errorEl.textContent = "⚠️ Student name cannot be empty!";
    return;
  }
  if (scoreInput === "" || isNaN(score)) {
    errorEl.textContent = "⚠️ Please enter a valid score!";
    return;
  }
  if (score < 0 || score > 100) {
    errorEl.textContent = "⚠️ Score must be between 0 and 100!";
    return;
  }

  // Check duplicate name
  const duplicate = studentList.find(
    (s) => s.name.toLowerCase() === name.toLowerCase(),
  );
  if (duplicate) {
    errorEl.textContent = "⚠️ Student with this name already exists!";
    return;
  }

  errorEl.textContent = "";

  // Create new student object
  const newStudent = {
    id: Date.now(),
    name: name,
    score: score,
    passed: score >= 75,
  };

  studentList.push(newStudent);
  saveToStorage();

  // Reset form
  document.getElementById("inputName").value = "";
  document.getElementById("inputScore").value = "";
  document.getElementById("inputName").focus();

  renderTable();
  updateStats();
}

function deleteStudent(id) {
  const student = studentList.find((s) => s.id === id);
  if (!confirm(`Delete "${student.name}"?`)) return;

  studentList = studentList.filter((s) => s.id !== id);
  saveToStorage();
  renderTable();
  updateStats();
}

function openEditModal(id) {
  const student = studentList.find((s) => s.id === id);
  if (!student) return;

  editingId = id;
  document.getElementById("editName").value = student.name;
  document.getElementById("editScore").value = student.score;
  document.getElementById("editError").textContent = "";
  document.getElementById("editModal").classList.remove("hidden");
}

function saveEdit() {
  const name = document.getElementById("editName").value.trim();
  const scoreInput = document.getElementById("editScore").value;
  const score = parseFloat(scoreInput);
  const errorEl = document.getElementById("editError");

  // Validation
  if (!name) {
    errorEl.textContent = "⚠️ Name cannot be empty!";
    return;
  }
  if (scoreInput === "" || isNaN(score) || score < 0 || score > 100) {
    errorEl.textContent = "⚠️ Score must be between 0-100!";
    return;
  }

  //Update student data
  studentList = studentList.map((s) =>
    s.id === editingId
      ? { ...s, name: name, score: score, passed: score >= 75 }
      : s,
  );

  saveToStorage();
  closeEditModal();
  renderTable();
  updateStats();
}

function closeEditModal() {
  editingId = null;
  document.getElementById("editModal").classList.add("hidden");
}

// EXPORT CSV
function exportCSV() {
  if (studentList.length === 0) {
    alert("No data to export!");
    return;
  }

  // Build CSV content
  const header = "No, Name, Score, Status";
  const rows = studentList.map(
    (s, i) =>
      `${i + 1}, ${s.name}, ${s.score}, ${s.passed ? "Passed" : "Failed"}`,
  );

  const csvContent = [header, ...rows].join("\n");

  // Download file
  const blob = new Blob([csvContent], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "grade-manager.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// RENDER FUNCTION
function getFilteredAndSortedData() {
  let data = [...studentList];

  // Filter by status
  if (activeFilter === "passed") {
    data = data.filter((s) => s.passed);
  } else if (activeFilter === "failed") {
    data = data.filter((s) => !s.passed);
  }

  // Filter by search query
  if (searchQuery) {
    data = data.filter((s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }

  // Sort
  if (sortConfig.field) {
    data.sort((a, b) => {
      if (sortConfig.field === "name") {
        return sortConfig.direction === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
      if (sortConfig.field === "score") {
        return sortConfig.direction === "asc"
          ? a.score - b.score
          : b.score - a.score;
      }
      return 0;
    });
  }

  return data;
}

function renderTable() {
  const tbody = document.getElementById("tableBody");
  const table = document.getElementById("studentTable");
  const emptyMessage = document.getElementById("emptyMessage");
  const data = getFilteredAndSortedData();

  if (studentList.length === 0) {
    emptyMessage.style.display = "block";
    emptyMessage.textContent = "No student data yet. Add a new student above!";
    table.style.display = "none";
    return;
  }

  if (data.length === 0) {
    emptyMessage.style.display = "block";
    emptyMessage.textContent = "No student match the current filter/search.";
    table.style.display = "none";
    return;
  }

  emptyMessage.style.display = "none";
  table.style.display = "table";

  let rows = "";
  for (let i = 0; i < data.length; i++) {
    const s = data[i];
    const badge = s.passed
      ? `<span class="badge badge-passed">✅ Passed</span>`
      : `<span class="badge badge-failed">❌ Failed</span>`;

    rows += `
        <tr>
            <td>${i + 1}</td>
            <td>${s.name}</td>
            <td>${s.score}</td>
            <td>${badge}</td>
            <td>
                <button class="btn-edit" onclick="openEditModal(${s.id})">✏️ Edit</button>
                <button class="btn-delete" onclick="deleteStudent(${s.id})">🗑️ Delete</button>
            </td>
        </tr>
    `;
  }
  tbody.innerHTML = rows;
}

function updateStats() {
  document.getElementById("statTotal").textContent = studentList.length;

  if (studentList.length === 0) {
    document.getElementById("statAverage").textContent = "-";
    document.getElementById("statHighest").textContent = "-";
    document.getElementById("statLowest").textContent = "-";
    return;
  }

  const total = studentList.reduce((acc, s) => acc + s.score, 0);
  const average = total / studentList.length;

  let highest = studentList[0].score;
  let lowest = studentList[0].score;
  for (const s of studentList) {
    if (s.score > highest) highest = s.score;
    if (s.score < lowest) lowest = s.score;
  }
  document.getElementById("statAverage").textContent = average.toFixed(1);
  document.getElementById("statHighest").textContent = highest;
  document.getElementById("statLowest").textContent = lowest;
}

// EVENT LISTENERS

// Add student
document.getElementById("btnAdd").addEventListener("click", addStudent);

// Enter key in input
document.getElementById("inputName").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addStudent();
});
document.getElementById("inputScore").addEventListener("keypress", (e) => {
  if (e.key === "Enter") addStudent();
});

// Filter buttons
document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    renderTable();
  });
});

// Search
document.getElementById("searchInput").addEventListener("input", (e) => {
  searchQuery = e.target.value;
  renderTable();
});

// Sort
document.getElementById("sortSelect").addEventListener("change", (e) => {
  const value = e.target.value;
  if (!value) {
    sortConfig = { field: null, direction: "asc" };
  } else {
    const [field, direction] = value.split("-");
    sortConfig = { field, direction };
  }
  renderTable();
});

// Export CSV
document.getElementById("btnExport").addEventListener("click", exportCSV);

// Edit modal buttons
document.getElementById("btnSaveEdit").addEventListener("click", saveEdit);
document
  .getElementById("btnCancelEdit")
  .addEventListener("click", closeEditModal);

// Close modal when clicking outside
document.getElementById("editModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("editModal")) {
    closeEditModal();
  }
});

// Edit modal: Enter key to save
document.getElementById("editScore").addEventListener("keypress", (e) => {
  if (e.key === "Enter") saveEdit();
});

// INIT
loadFromStorage();
renderTable();
updateStats();

console.log("Grade Manager ready!");
