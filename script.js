document.addEventListener("DOMContentLoaded", () => {
  // --- CONFIGURATION: Update this URL to your actual server address ---
  const API_BASE_URL = "http://localhost:3000/api/projects";
  // This assumes your backend has an endpoint at /api/projects

  // Global variable to track language status
  let isEnglish = true;

  // --- 1. Language Toggle Logic ---
  const langToggle = document.getElementById("lang-toggle");
  const body = document.body;

  const updateLanguage = () => {
    const lang = isEnglish ? "en" : "ar";
    const newDir = isEnglish ? "ltr" : "rtl";
    const toggleText = langToggle.getAttribute(
      `data-${isEnglish ? "ar" : "en"}`
    );

    body.setAttribute("dir", newDir);
    langToggle.textContent = toggleText;

    document.querySelectorAll("[data-en], [data-ar]").forEach((element) => {
      const translation = element.getAttribute(`data-${lang}`);
      if (translation) {
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.setAttribute("placeholder", translation);
        } else {
          element.textContent = translation;
        }
      }
    });
    const titleElement = document.querySelector("title");
    if (titleElement) {
      titleElement.textContent =
        titleElement.getAttribute(`data-${lang}`) || titleElement.textContent;
    }
  };

  langToggle.addEventListener("click", () => {
    isEnglish = !isEnglish;
    updateLanguage();
  });

  updateLanguage(); // Initialize language on load

  // --- 2. Smooth Scrolling (Omitted for brevity) ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const target = document.querySelector(targetId);

      if (target) {
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition =
          elementPosition +
          window.pageYOffset -
          (targetId === "#home" ? 0 : 60);

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    });
  });

  // --- 3. UPLOAD & DISPLAY LOGIC (MODIFIED FOR API) ---
  const modelsContainer = document.getElementById("models-viewer-container");
  const modelForm = document.getElementById("studio3d-upload-form");
  const modelFormMessage = document.getElementById("model-form-message");
  const noModelsMsg = document.getElementById("no-models-msg");

  let submittedModels = []; // Now holds data fetched from API

  /**
   * Fetches all projects from the backend API.
   */
  const fetchModels = async () => {
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error("Failed to fetch projects from server.");
      }
      submittedModels = await response.json();
      renderSubmittedModels();
    } catch (error) {
      console.error("Error fetching projects:", error);
      modelFormMessage.textContent = isEnglish
        ? "Error loading projects. Is the backend server running?"
        : "خطأ في تحميل المشاريع. هل خادم الواجهة الخلفية يعمل؟";
      modelFormMessage.style.color = "red";
    }
  };

  /**
   * Deletes a project by ID via the API.
   */
  const deleteModel = async (modelId) => {
    if (
      !confirm(
        isEnglish
          ? "Are you sure you want to delete this project?"
          : "هل أنت متأكد أنك تريد حذف هذا المشروع؟"
      )
    ) {
      return;
    }

    try {
      // Note: Assumes your API for deletion is POST /api/projects/delete/:id or DELETE /api/projects/:id
      const response = await fetch(`${API_BASE_URL}/delete/${modelId}`, {
        method: "POST", // Using POST for broader CORS compatibility, but DELETE is standard
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete project on server.");
      }

      // Re-fetch and re-render the list after successful deletion
      await fetchModels();
      modelFormMessage.textContent = isEnglish
        ? "Project deleted successfully."
        : "تم حذف المشروع بنجاح.";
      modelFormMessage.style.color = "#4CAF50";
      setTimeout(() => {
        modelFormMessage.textContent = "";
      }, 3000);
    } catch (error) {
      console.error(`Error deleting model ${modelId}:`, error);
      modelFormMessage.textContent = isEnglish
        ? "Error deleting project. Check server console."
        : "خطأ في حذف المشروع. تحقق من وحدة تحكم الخادم.";
      modelFormMessage.style.color = "red";
    }
  };

  const renderSubmittedModels = () => {
    modelsContainer.innerHTML = "";
    if (noModelsMsg) {
      noModelsMsg.style.display =
        submittedModels.length === 0 ? "block" : "none";
    }

    submittedModels
      .slice()
      .reverse()
      .forEach((model) => {
        // IMPORTANT: The server MUST return data with these property names!
        // Primary link for viewing/downloading
        const modelSource = model.mainUrl;
        // Secondary link for source files, etc.
        const secondaryLink = model.secondaryUrl;

        // Determine if it's a 3D model (for interactive viewing)
        const is3DModel =
          modelSource &&
          (modelSource.toLowerCase().endsWith(".glb") ||
            modelSource.toLowerCase().endsWith(".gltf"));

        const card = document.createElement("div");
        card.className = "model-viewer-card";

        const hasSecondaryLink =
          secondaryLink &&
          typeof secondaryLink === "string" &&
          secondaryLink.trim() !== "";

        // Secondary Link Button setup
        const secondaryLinkHtml = hasSecondaryLink
          ? `<a href="${secondaryLink}" target="_blank" class="link-button" data-en="Download Source/Project" data-ar="تحميل المصدر/المشروع">Download Source/Project <i class="fas fa-download"></i></a>`
          : `<span class="link-button disabled-link" data-en="No Source Link" data-ar="لا يوجد رابط مصدر">No Source Link</span>`;

        // Deletion button setup
        const delete3DButton = document.createElement("button");
        delete3DButton.className = "button small-button delete-button";
        delete3DButton.setAttribute("data-en", "DELETE");
        delete3DButton.setAttribute("data-ar", "حذف");
        delete3DButton.style.marginLeft = "10px";
        delete3DButton.innerHTML = `<i class="fas fa-trash"></i>`;

        // Use the database ID (_id) for deletion
        delete3DButton.onclick = (e) => {
          e.preventDefault();
          deleteModel(model._id);
        };

        const headerContent = document.createElement("div");
        headerContent.style.display = "flex";
        headerContent.style.alignItems = "center";
        headerContent.innerHTML = `<h4 data-en="File: ${model.title}" data-ar="الملف: ${model.title}">File: ${model.title}</h4>`;
        headerContent.appendChild(delete3DButton);

        // Conditional Viewer/Download Content
        const viewerContent = is3DModel
          ? `
                        <model-viewer 
                            src="${modelSource}" 
                            alt="${model.title}" 
                            shadow-intensity="1" 
                            camera-controls 
                            auto-rotate 
                            min-field-of-view="10deg"
                            max-field-of-view="90deg"
                            loading="eager"
                        ></model-viewer>`
          : `<div class="document-download-container">
                            <a href="${modelSource}" target="_blank" download="${model.title}" class="button primary-button large-button" data-en="Download Document" data-ar="تحميل المستند">
                                <i class="fas fa-file-download"></i> Download Document
                            </a>
                        </div>`;

        card.innerHTML = `
                        <div class="model-viewer-header">
                            ${headerContent.outerHTML}
                            ${secondaryLinkHtml}
                        </div>
                        <div class="model-viewer-container">
                            ${viewerContent}
                        </div>
                    `;
        modelsContainer.appendChild(card);

        updateLanguage();
      });
  };

  if (modelForm) {
    modelForm.addEventListener("submit", async function (e) {
      e.preventDefault();

      const titleInput = document.getElementById("model-title");
      const urlInput = document.getElementById("document-url");
      const linkInput = document.getElementById("blender-link");

      if (!titleInput || !urlInput) {
        console.error("Missing required form elements. Check HTML IDs.");
        return;
      }

      const title = titleInput.value.trim();
      const mainUrl = urlInput.value.trim(); // Renamed for clarity in data object
      const secondaryUrl = linkInput ? linkInput.value.trim() : "";

      if (!title || !mainUrl) {
        modelFormMessage.textContent = isEnglish
          ? "Title and a direct file link (URL) are required."
          : "العنوان ورابط الملف المباشر (URL) مطلوبان.";
        modelFormMessage.style.color = "red";
        return;
      }

      // Collect data for the API
      const newProject = {
        title,
        mainUrl, // The primary file/model URL
        secondaryUrl, // The optional source/project link
        // Add any other fields your Mongoose schema requires here
      };

      try {
        const response = await fetch(API_BASE_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newProject),
        });

        if (!response.ok) {
          throw new Error("Failed to save project to server.");
        }

        // --- Success Handling ---
        const savedProject = await response.json(); // Get the saved project back

        // Clear the form and update the list
        modelForm.reset();
        await fetchModels(); // Fetch the updated list from the server

        modelFormMessage.textContent = isEnglish
          ? `Project "${title}" added successfully!`
          : `تمت إضافة المشروع "${title}" بنجاح!`;
        modelFormMessage.style.color = "#4CAF50";
        setTimeout(() => {
          modelFormMessage.textContent = "";
        }, 5000);
      } catch (error) {
        console.error("Error submitting project:", error);
        modelFormMessage.textContent = isEnglish
          ? `Failed to add project. Check your server status and console.`
          : `فشل في إضافة المشروع. تحقق من حالة الخادم ووحدة التحكم.`;
        modelFormMessage.style.color = "red";
      }
    });
  }

  // Initial load: Fetch existing projects from the API when the page loads
  fetchModels();
});
