import React, { useState, useEffect } from "react";
import { Plus, Search, Calendar, CheckSquare, User, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { CookieUtils } from "@/utils/cookie";
import useDebounce from "@/utils/useDebounce";

const TaskComponent = ({ setCurrentPage }) => {
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    dueDate: "",
    category: "Personal",
    priority: "medium",
    status: "pending",
  });

  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [createTaskError, setCreateTaskError] = useState("");
  const [taskValidationErrors, setTaskValidationErrors] = useState({});
  const [editingTask, setEditingTask] = useState(null);

  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = [
    { name: "Personal", count: 4, icon: User },
    { name: "Home", count: 6, icon: Calendar },
    { name: "Office", count: 8, icon: Calendar },
  ];

  const searchDebounce = useDebounce(search);

  const fetchTasks = async (page = 1, limit = 10) => {
    setIsLoadingTasks(true);
    setTasksError("");

    try {
      const token = CookieUtils.getCookie("authToken");

      if (!token) {
        setTasksError("Authentication required");
        setCurrentPage("login");
        return;
      }

      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (searchDebounce) params.append("search", searchDebounce);
      if (selectedCategory) params.append("category", selectedCategory);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_ENDPOINT}/tasks?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (response.ok) {
        setTasks(data.tasks || []);
        setPagination({
          page: data.pagination?.page || page,
          limit: data.pagination?.limit || limit,
          total: data.pagination?.total || 0,
        });
      } else {
        if (response.status === 401) {
          CookieUtils.clearAllCookies();
          setCurrentPage("login");
          setTasksError("Session expired. Please login again.");
        } else {
          setTasksError(data.message || "Failed to fetch tasks");
        }
      }
    } catch (err) {
      setTasksError("Unable to connect to server");
      console.error("Fetch tasks error:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  useEffect(() => {
    fetchTasks(pagination.page, pagination.limit);
  }, [selectedCategory, searchDebounce]);

  const validateTaskForm = () => {
    const errors = {};

    if (!newTask.title.trim()) {
      errors.title = "Title is required";
    } else if (newTask.title.trim().length < 3) {
      errors.title = "Title must be at least 3 characters";
    }

    if (newTask.dueDate) {
      const selectedDate = new Date(newTask.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(selectedDate.getTime())) {
        errors.dueDate = "Invalid date format";
      } else if (selectedDate < today) {
        errors.dueDate = "Due date cannot be in the past";
      }
    }

    if (!newTask.category) {
      errors.category = "Category is required";
    }

    setTaskValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTaskInputChange = (field, value) => {
    setNewTask({ ...newTask, [field]: value });
    if (taskValidationErrors[field]) {
      setTaskValidationErrors({ ...taskValidationErrors, [field]: "" });
    }
  };

  const addTask = async () => {
    setCreateTaskError("");
    setTaskValidationErrors({});

    if (!validateTaskForm()) {
      return;
    }

    setIsCreatingTask(true);

    try {
      const token = CookieUtils.getCookie("authToken");

      if (!token) {
        setCreateTaskError("Authentication required");
        setCurrentPage("login");
        return;
      }

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        due_date: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString()
          : undefined,
        category: newTask.category,
        status: newTask.status,
        priority: newTask.priority,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/tasks`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (response.ok) {
        setNewTask({
          title: "",
          description: "",
          dueDate: "",
          category: "Personal",
          priority: "medium",
          status: "pending",
        });
        setShowAddTask(false);
        fetchTasks(pagination.page, pagination.limit);
      } else {
        if (response.status === 401) {
          CookieUtils.clearAllCookies();
          setCurrentPage("login");
          setCreateTaskError("Session expired. Please login again.");
        } else {
          setCreateTaskError(data.message || "Failed to create task");
        }
      }
    } catch (err) {
      setCreateTaskError("Unable to connect to server");
      console.error("Create task error:", err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const updateTask = async () => {
    setCreateTaskError("");
    setTaskValidationErrors({});

    if (!validateTaskForm()) {
      return;
    }

    setIsCreatingTask(true);

    try {
      const token = CookieUtils.getCookie("authToken");

      if (!token) {
        setCreateTaskError("Authentication required");
        setCurrentPage("login");
        return;
      }

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || undefined,
        due_date: newTask.dueDate
          ? new Date(newTask.dueDate).toISOString()
          : undefined,
        category: newTask.category,
        status: newTask.status,
        priority: newTask.priority,
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/tasks/${editingTask.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(taskData),
      });

      const data = await response.json();

      if (response.ok) {
        setNewTask({
          title: "",
          description: "",
          dueDate: "",
          category: "Personal",
          priority: "medium",
          status: "pending",
        });
        setEditingTask(null);
        setShowAddTask(false);
        fetchTasks(pagination.page, pagination.limit);
      } else {
        if (response.status === 401) {
          CookieUtils.clearAllCookies();
          setCurrentPage("login");
          setCreateTaskError("Session expired. Please login again.");
        } else {
          setCreateTaskError(data.error || data.message || "Failed to update task");
        }
      }
    } catch (err) {
      setCreateTaskError("Unable to connect to server");
      console.error("Update task error:", err);
    } finally {
      setIsCreatingTask(false);
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setNewTask({
      title: task.title || "",
      description: task.description || "",
      dueDate: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
      category: task.category || "Personal",
      priority: task.priority || "medium",
      status: task.status || "pending",
    });
    setShowAddTask(true);
    setCreateTaskError("");
    setTaskValidationErrors({});
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);

    try {
      const token = CookieUtils.getCookie("authToken");

      if (!token) {
        setTasksError("Authentication required");
        setCurrentPage("login");
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/tasks/${taskToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setShowDeleteConfirm(false);
        setTaskToDelete(null);
        fetchTasks(pagination.page, pagination.limit);
      } else {
        const data = await response.json();
        if (response.status === 401) {
          CookieUtils.clearAllCookies();
          setCurrentPage("login");
          setTasksError("Session expired. Please login again.");
        } else {
          setTasksError(data.error || data.message || "Failed to delete task");
        }
        setShowDeleteConfirm(false);
        setTaskToDelete(null);
      }
    } catch (err) {
      setTasksError("Unable to connect to server");
      console.error("Delete task error:", err);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleTaskSubmit = () => {
    if (editingTask) {
      updateTask();
    } else {
      addTask();
    }
  };

  const handleCloseModal = () => {
    setShowAddTask(false);
    setEditingTask(null);
    setNewTask({
      title: "",
      description: "",
      dueDate: "",
      category: "Personal",
      priority: "medium",
      status: "pending",
    });
    setCreateTaskError("");
    setTaskValidationErrors({});
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="flex h-[90vh] max-w-7xl w-full bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden">
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">TASKS</h1>
          </div>

          <nav className="space-y-1 flex-1">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(selectedCategory === cat.name ? "" : cat.name);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition ${
                  selectedCategory === cat.name
                    ? "bg-orange-500/10 text-orange-500 border border-orange-500/20"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <cat.icon className="w-4 h-4" />
                  <span>{cat.name}</span>
                </div>
                {/* <span
                  className={`text-sm ${
                    selectedCategory === cat.name ? "text-orange-500" : "text-zinc-500"
                  }`}
                >
                  {cat.count}
                </span> */}
              </button>
            ))}
          </nav>

          <div className="pt-6 border-t border-zinc-800">
            <button
              onClick={() => {
                CookieUtils.clearAllCookies();
                setCurrentPage("login");
              }}
              className="w-full px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col">
          <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2 rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold shadow-lg shadow-orange-500/25"
              >
                <Plus className="w-5 h-5" />
                New task
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedCategory || "All Tasks"}</h2>
                <span className="text-zinc-500">{pagination.total} total tasks</span>
              </div>

              {tasksError && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 mb-4">
                  {tasksError}
                </div>
              )}

              {isLoadingTasks ? (
                <div className="flex items-center justify-center py-12">
                  <svg
                    className="animate-spin h-8 w-8 text-orange-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              ) : tasks.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks found. Create your first task!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition group"
                    >
                      <div className="flex-1">
                        <span
                          className={
                            task.status === "completed"
                              ? "text-zinc-500 line-through"
                              : "text-white"
                          }
                        >
                          {task.title}
                        </span>
                        {task.description && (
                          <p className="text-sm text-zinc-500 mt-1">{task.description}</p>
                        )}
                      </div>
                      {task.priority && (
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            task.priority === "high"
                              ? "bg-red-500/20 text-red-400"
                              : task.priority === "medium"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : "bg-blue-500/20 text-blue-400"
                          }`}
                        >
                          {task.priority}
                        </span>
                      )}
                      {task.due_date && (
                        <span className="text-xs text-orange-500">
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                      {task.category && (
                        <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                          {task.category}
                        </span>
                      )}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-1.5 hover:bg-zinc-800 rounded text-blue-400 hover:text-blue-300 transition"
                          title="Edit task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(task)}
                          className="p-1.5 hover:bg-zinc-800 rounded text-red-400 hover:text-red-300 transition"
                          title="Delete task"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() => fetchTasks(pagination.page - 1, pagination.limit)}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-zinc-400">
                    Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    onClick={() => fetchTasks(pagination.page + 1, pagination.limit)}
                    disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                    className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-xl font-bold">Delete Task</h3>
            </div>
            <p className="text-zinc-400 mb-2">Are you sure you want to delete this task?</p>
            <p className="text-white font-medium mb-6">"{taskToDelete.title}"</p>
            <p className="text-sm text-zinc-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteTask}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-semibold disabled:opacity-50 flex items-center justify-center"
              >
                {isDeleting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  "Delete Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingTask ? "Edit Task" : "Add Task"}</h3>

            {createTaskError && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm mb-4">
                {createTaskError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Task Title *</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => handleTaskInputChange("title", e.target.value)}
                  placeholder="What do you want to accomplish?"
                  disabled={isCreatingTask}
                  className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition disabled:opacity-50 ${
                    taskValidationErrors.title
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-700 focus:border-orange-500 focus:ring-orange-500/20"
                  }`}
                />
                {taskValidationErrors.title && (
                  <p className="mt-1 text-sm text-red-400">{taskValidationErrors.title}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => handleTaskInputChange("description", e.target.value)}
                  placeholder="Add more details about this task..."
                  disabled={isCreatingTask}
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition disabled:opacity-50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Due Date</label>
                <input
                  type="datetime-local"
                  value={newTask.dueDate}
                  onChange={(e) => handleTaskInputChange("dueDate", e.target.value)}
                  disabled={isCreatingTask}
                  className={`w-full bg-zinc-800 border rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 transition disabled:opacity-50 ${
                    taskValidationErrors.dueDate
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      : "border-zinc-700 focus:border-orange-500 focus:ring-orange-500/20"
                  }`}
                />
                {taskValidationErrors.dueDate && (
                  <p className="mt-1 text-sm text-red-400">{taskValidationErrors.dueDate}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Category *</label>
                <div className="flex gap-2 flex-wrap">
                  {["Personal", "Home", "Office"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleTaskInputChange("category", cat)}
                      disabled={isCreatingTask}
                      className={`px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                        newTask.category === cat
                          ? "bg-orange-500 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {taskValidationErrors.category && (
                  <p className="mt-1 text-sm text-red-400">{taskValidationErrors.category}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Priority</label>
                <div className="flex gap-2">
                  {[
                    { value: "low", label: "Low", color: "bg-blue-500" },
                    { value: "medium", label: "Medium", color: "bg-yellow-500" },
                    { value: "high", label: "High", color: "bg-red-500" },
                  ].map((priority) => (
                    <button
                      key={priority.value}
                      type="button"
                      onClick={() => handleTaskInputChange("priority", priority.value)}
                      disabled={isCreatingTask}
                      className={`flex-1 px-4 py-2 rounded-lg transition disabled:opacity-50 ${
                        newTask.priority === priority.value
                          ? `${priority.color} text-white`
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {priority.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Status</label>
                <select
                  value={newTask.status}
                  onChange={(e) => handleTaskInputChange("status", e.target.value)}
                  disabled={isCreatingTask}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition disabled:opacity-50"
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={handleCloseModal}
                disabled={isCreatingTask}
                className="flex-1 px-4 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTaskSubmit}
                disabled={isCreatingTask}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold shadow-lg shadow-orange-500/25 disabled:opacity-50 flex items-center justify-center"
              >
                {isCreatingTask ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {editingTask ? "Updating..." : "Creating..."}
                  </>
                ) : editingTask ? (
                  "Update Task"
                ) : (
                  "Add Task"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskComponent;