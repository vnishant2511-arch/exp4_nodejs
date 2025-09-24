const readline = require('readline');

// Employee array to store all employees
let employees = [];

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Employee class to structure employee data
class Employee {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }
}

// Function to display menu
function showMenu() {
  console.log('\n=== Employee Management System ===');
  console.log('1. Add Employee');
  console.log('2. List All Employees');
  console.log('3. Remove Employee by ID');
  console.log('4. Search Employee by ID');
  console.log('5. Exit');
  console.log('====================================');
}

// Function to add a new employee
function addEmployee() {
  rl.question('Enter employee name: ', (name) => {
    if (!name.trim()) {
      console.log('Error: Employee name cannot be empty!');
      return showMenuAndGetChoice();
    }
    
    rl.question('Enter employee ID: ', (id) => {
      if (!id.trim()) {
        console.log('Error: Employee ID cannot be empty!');
        return showMenuAndGetChoice();
      }
      
      // Check if employee ID already exists
      const existingEmployee = employees.find(emp => emp.id === id);
      if (existingEmployee) {
        console.log(`Error: Employee with ID ${id} already exists!`);
        return showMenuAndGetChoice();
      }
      
      // Add new employee
      const newEmployee = new Employee(name.trim(), id.trim());
      employees.push(newEmployee);
      console.log(`✓ Employee ${name} (ID: ${id}) added successfully!`);
      showMenuAndGetChoice();
    });
  });
}

// Function to list all employees
function listEmployees() {
  console.log('\n=== Employee List ===');
  
  if (employees.length === 0) {
    console.log('No employees found.');
  } else {
    console.log('ID\t| Name');
    console.log('--------|----------------');
    employees.forEach(employee => {
      console.log(`${employee.id}\t| ${employee.name}`);
    });
    console.log(`\nTotal employees: ${employees.length}`);
  }
  
  showMenuAndGetChoice();
}

// Function to remove employee by ID
function removeEmployee() {
  if (employees.length === 0) {
    console.log('No employees to remove.');
    return showMenuAndGetChoice();
  }
  
  rl.question('Enter employee ID to remove: ', (id) => {
    if (!id.trim()) {
      console.log('Error: Employee ID cannot be empty!');
      return showMenuAndGetChoice();
    }
    
    const initialLength = employees.length;
    employees = employees.filter(emp => emp.id !== id.trim());
    
    if (employees.length < initialLength) {
      console.log(`✓ Employee with ID ${id} removed successfully!`);
    } else {
      console.log(`Error: No employee found with ID ${id}`);
    }
    
    showMenuAndGetChoice();
  });
}

// Function to search employee by ID
function searchEmployee() {
  if (employees.length === 0) {
    console.log('No employees to search.');
    return showMenuAndGetChoice();
  }
  
  rl.question('Enter employee ID to search: ', (id) => {
    if (!id.trim()) {
      console.log('Error: Employee ID cannot be empty!');
      return showMenuAndGetChoice();
    }
    
    const employee = employees.find(emp => emp.id === id.trim());
    
    if (employee) {
      console.log('\n=== Employee Found ===');
      console.log(`Name: ${employee.name}`);
      console.log(`ID: ${employee.id}`);
    } else {
      console.log(`Error: No employee found with ID ${id}`);
    }
    
    showMenuAndGetChoice();
  });
}

// Function to show menu and get user choice
function showMenuAndGetChoice() {
  showMenu();
  rl.question('Enter your choice (1-5): ', (choice) => {
    switch (choice) {
      case '1':
        addEmployee();
        break;
      case '2':
        listEmployees();
        break;
      case '3':
        removeEmployee();
        break;
      case '4':
        searchEmployee();
        break;
      case '5':
        console.log('Thank you for using Employee Management System!');
        rl.close();
        break;
      default:
        console.log('Invalid choice! Please enter a number between 1-5.');
        showMenuAndGetChoice();
    }
  });
}

// Start the application
console.log('Welcome to Employee Management System!');
showMenuAndGetChoice();

// Handle application exit
rl.on('close', () => {
  console.log('Goodbye!');
  process.exit(0);
});