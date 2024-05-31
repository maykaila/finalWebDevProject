const { createClient } = supabase;
const supabaseUrl = 'https://ivdufcxfxeimpvulmfib.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2ZHVmY3hmeGVpbXB2dWxtZmliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY0MzU2NjcsImV4cCI6MjAzMjAxMTY2N30.pu3e2DdancyGYB3U6ZAFVNjji2EUtZN6dOk8rh5uzKg';
const connection = createClient(supabaseUrl, supabaseKey);

async function checkAuthStatus() {
    const user = await connection.auth.user();
    const profileLink = document.getElementById('profileLink');

    if (user) {
        profileLink.href = 'profileregistered.html';
    } else {
        profileLink.href = 'profileguest.html';
    }
}

checkAuthStatus();

let months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
let currentWeek = 1;
let currentMonth = 0; // Starting from January
let currentYear = 2024; // Starting year

async function next() {
    currentWeek++;
    if (currentWeek > 4) {
        currentWeek = 1;
        currentMonth++;
        if (currentMonth >= months.length) {
            currentMonth = 0;
            currentYear++;
        }
        document.getElementById('Date').textContent = ${months[currentMonth]} ${currentYear};
    }
    document.getElementById('Week-label').textContent = Week ${currentWeek};
    document.getElementById('next1').style.display = 'inline';
    loadTasks();
}

async function back() {
    currentWeek--;
    if (currentWeek < 1) {
        currentWeek = 4;
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = months.length - 1;
            currentYear--;
        }
        document.getElementById('Date').textContent = ${months[currentMonth]} ${currentYear};
    }
    document.getElementById('Week-label').textContent = Week ${currentWeek};
    document.getElementById('next1').style.display = 'inline';
    loadTasks();
}

function goToMonthYear() {
    const monthInput = document.getElementById('monthInput').value;
    const yearInput = document.getElementById('yearInput').value;

    if (monthInput && yearInput) {
        const monthIndex = parseInt(monthInput) - 1;
        const year = parseInt(yearInput);

        if (monthIndex >= 0 && monthIndex < months.length && year > 0) {
            currentMonth = monthIndex;
            currentYear = year;
            currentWeek = 1;

            document.getElementById('Date').textContent = ${months[currentMonth]} ${currentYear};
            document.getElementById('Week-label').textContent = Week ${currentWeek};
            loadTasks();
        }
    }
}

async function loadTasks() {
    const taskContainer = document.getElementById('task-container');
    taskContainer.innerHTML = ''; // Clear previous tasks

    const username = localStorage.getItem('username'); // Get username from localStorage

    if (!username) {
        console.log('Username is not available.');
        return;
    }

    const { data: tasks, error } = await connection
        .from('user_task')
        .select('*')
        .eq('month', months[currentMonth])
        .eq('year', currentYear)
        .eq('week', currentWeek)
        .eq('username', username); // Filter by username

    if (error) {
        console.error('Error loading tasks:', error);
    } else {
        tasks.forEach((task) => addNewTask(task.task, task.id, true, task.status));
    }
}

async function addNewTask(text = '', id = null, isSaved = false, status = 'Ongoing') {
    const taskContainer = document.getElementById('task-container');
    const task = document.createElement('div');
    task.classList.add('task-container');
    task.setAttribute('data-task-id', id);

    if (isSaved) {
        const taskParagraph = document.createElement('p');
        taskParagraph.classList.add('task');
        taskParagraph.textContent = text;
        taskParagraph.onclick = () => {
            taskParagraph.classList.toggle('completed');
            toggleTaskFinished(taskParagraph, id);
        };
        
        const removeButton = document.createElement('button');
        removeButton.classList.add('remove-btn');
        removeButton.textContent = 'X';
        removeButton.onclick = () => {
            removeTask(id);
        };

        const statusText = document.createElement('span');
        statusText.classList.add('task-status');
        statusText.textContent =  Task ${status};
        statusText.style.color = status === 'Finished' ? 'green' : 'orange';
        
        task.appendChild(removeButton);
        task.appendChild(taskParagraph);
        task.appendChild(statusText);
    } else {
        task.innerHTML = `
            <input type="text" class="task" placeholder="Task" value="${text}">
            <button class="save-btn" onclick="saveTask(this)">Save</button>
        `;

        const taskInput = task.querySelector('.task');
        taskInput.addEventListener('input', () => {});
    }

    taskContainer.appendChild(task);
}

async function saveTask(button) {
    const taskContainer = button.parentNode;
    const taskInput = taskContainer.querySelector('.task');
    const taskText = taskInput.value.trim();
    const username = localStorage.getItem('username'); // Get username from localStorage

    if (!username) {
        console.error('Username is not available.');
        return;
    }

    const { data, error } = await connection
        .from('user_task')
        .insert({ task: taskText, month: months[currentMonth], year: currentYear, week: currentWeek, status: 'Ongoing', username: username });

    if (error) {
        console.error('Error saving task:', error);
    } else {
        console.log('Task saved:', data);

        // Add the new task to the task container
        addNewTask(taskText, data[0].id, true);

        // Remove the input box and save button
        taskContainer.removeChild(taskInput);
        taskContainer.removeChild(button);
    }
}

async function toggleTaskFinished(taskParagraph, taskId) {
    const isCompleted = taskParagraph.classList.contains('completed');
    const newStatus = isCompleted ? 'Finished' : 'Ongoing';
    const { data, error } = await connection
        .from('user_task')
        .update({ status: newStatus })
        .eq('id', taskId);

    if (error) {
        console.error('Error updating task status:', error);
    } else {
        const statusText = taskParagraph.nextElementSibling; // Selecting the next element
        if (statusText && statusText.classList.contains('task-status')) {
            statusText.textContent =  Task ${newStatus};
            statusText.style.color = newStatus === 'Finished' ? 'green' : 'orange';
        } else {
            console.error('Status text element not found or not structured correctly.');
        }
    }
}

async function removeTask(taskId) {
    const { error } = await connection
        .from('user_task')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error removing task:', error);
    } else {
        const taskToRemove = document.querySelector([data-task-id="${taskId}"]);
        taskToRemove.remove();
        console.log('Task removed from database');
    }
}

window.onload = loadTasks;

// Signup Script

async function buttonPressSignup() {
    var email = document.getElementById("signupEmail").value;
    var name = document.getElementById("signupUserName").value;
    var passWord = document.getElementById("signupPassword").value;

    let { data: userByUsername } = await connection
        .from('user_info')
        .select('*')
        .eq('username', name);

    let { data: userByEmail } = await connection
        .from('user_info')
        .select('*')
        .eq('email', email);

    if (userByUsername.length > 0 || userByEmail.length > 0) {
        alert('Username or Email already exists.');
        return;
    }

    let { data, error } = await connection
        .from('user_info')
        .insert([
            { username: name, password: passWord, email: email }
        ]);

    if (error) {
        alert('Error during sign up: ' + error.message);
    } else {
        alert('Sign up successful! Please log in.');
        window.location.href = 'login.html';
    }
}

// Login Script

let loginAttempts = 0;

async function buttonPress() {
    const username = document.getElementById("cUserName").value;
    const password = document.getElementById("cPassword").value;
    
    const { data, error } = await connection
        .from('user_info')
        .select()
        .eq('username', username);

    if (error) {
        console.error('Error fetching user:', error.message);
        return;
    }

    if (data.length === 0) {
        alert('Username does not exist.');
        return;
    }

    const user = data[0];

    if (user.password !== password) {
        loginAttempts++;
        if (loginAttempts >= 3) {
            window.location.href = "forgotpass.html";
        } else {
            alert('Incorrect password. Please try again.');
        }
        return;
    }

    // Store the username in localStorage
    localStorage.setItem('username', username);

    // Redirect to homepage.html after successful login
    window.location.href = "homepage.html";
}

// Logout Script

document.getElementById('profileLink').addEventListener('click', async () => {
    await connection.auth.signOut();
    localStorage.removeItem('userSession');
    localStorage.removeItem('username');
    window.location.href = 'profileguest.html'; // Redirect to guest profile page after logout
});