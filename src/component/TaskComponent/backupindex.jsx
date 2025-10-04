import React, { useMemo, useState } from "react";
import { Plus, Search, Calendar, CheckSquare, User } from "lucide-react";
import { CookieUtils } from "@/utils/cookie";
import useDebounce from "@/utils/useDebounce";

const TaskComponent = ({ setCurrentPage }) => {
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState([]);
  const [showAddTask, setShowAddTask] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    date: "",
    tag: "Personal",
  });

  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
  });

  const categories = [
    // { name: "Today", count: 3, icon: Calendar },
    // { name: "Tomorrow", count: 4, icon: Calendar },
    // { name: "Overdue", count: 4, icon: Calendar },
    { name: "Personal", count: 4, icon: User },
    { name: "Home", count: 6, icon: Calendar },
    { name: "Office", count: 8, icon: Calendar },
  ];

  const searchDebounce = useDebounce(search);

  const toggleTask = (id) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const addTask = () => {
    if (newTask.title.trim()) {
      setTasks([
        ...tasks,
        {
          id: tasks.length + 1,
          title: newTask.title,
          category: selectedCategory,
          completed: false,
        },
      ]);
      setNewTask({ title: "", date: "", tag: "Personal" });
      setShowAddTask(false);
    }
  };

  // Fetch tasks from API
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
      //   if (priority) params.append("priority", priority);
      //   if (view) params.append("view", view);
      //   if (sort_by) params.append("sort_by", sort_by);
      //   if (sort_order) params.append("sort_order", sort_order);

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

  React.useEffect(() => {
    fetchTasks(pagination.page, pagination.limit);
  }, [selectedCategory, searchDebounce]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
      <div className="flex h-[90vh] max-w-7xl w-full bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 bg-zinc-900 border-r border-zinc-800 p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <CheckSquare className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-xl font-bold">TASKS</h1>
          </div>

          <nav className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                    if (cat.name == selectedCategory) {
                        setSelectedCategory("")
                    } else {
                        setSelectedCategory(cat.name)
                    }
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
                    selectedCategory === cat.name
                      ? "text-orange-500"
                      : "text-zinc-500"
                  }`}
                >
                  {cat.count}
                </span> */}
              </button>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-zinc-800">
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1 max-w-xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition"
                  onChange={(e) => {
                    setSearch(e.target.value);
                  }}
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

          {/* Tasks Content */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{selectedCategory}</h2>
                <span className="text-zinc-500">
                  {pagination.total} total tasks
                </span>
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
                      className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition"
                    >
                      <button
                        onClick={() => toggleTask(task.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                          task.completed || task.status === "completed"
                            ? "bg-orange-500 border-orange-500"
                            : "border-zinc-600 hover:border-orange-500"
                        }`}
                      >
                        {(task.completed || task.status === "completed") && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1">
                        <span
                          className={
                            task.completed || task.status === "completed"
                              ? "text-zinc-500 line-through"
                              : "text-white"
                          }
                        >
                          {task.title || task.name}
                        </span>
                        {task.description && (
                          <p className="text-sm text-zinc-500 mt-1">
                            {task.description}
                          </p>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className="text-xs text-orange-500">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {task.category && (
                        <span className="text-xs px-2 py-1 bg-zinc-800 rounded text-zinc-400">
                          {task.category}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowAddTask(true)}
                className="flex items-center gap-2 text-zinc-500 hover:text-white transition mt-4 px-4 py-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add new task</span>
              </button>

              {/* Pagination */}
              {pagination.total > pagination.limit && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <button
                    onClick={() =>
                      fetchTasks(pagination.page - 1, pagination.limit)
                    }
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-zinc-400">
                    Page {pagination.page} of{" "}
                    {Math.ceil(pagination.total / pagination.limit)}
                  </span>
                  <button
                    onClick={() =>
                      fetchTasks(pagination.page + 1, pagination.limit)
                    }
                    disabled={
                      pagination.page >=
                      Math.ceil(pagination.total / pagination.limit)
                    }
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

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Add Task</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  What are you upto?
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  placeholder="Brief text for what you want to accomplish."
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  When do you want to complete it?
                </label>
                <input
                  type="text"
                  value={newTask.date}
                  onChange={(e) =>
                    setNewTask({ ...newTask, date: e.target.value })
                  }
                  placeholder="Date in DD/MM/YYY"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Tags
                </label>
                <div className="flex gap-2">
                  {["Personal", "Home", "Office"].map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setNewTask({ ...newTask, tag })}
                      className={`px-4 py-2 rounded-lg transition ${
                        newTask.tag === tag
                          ? "bg-orange-500 text-white"
                          : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddTask(false)}
                className="flex-1 px-4 py-2.5 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition font-semibold shadow-lg shadow-orange-500/25"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskComponent;
