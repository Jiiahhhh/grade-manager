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
  const name = document.getElementById("inputName").ariaValueMax.trim();
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
