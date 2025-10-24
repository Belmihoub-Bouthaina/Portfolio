document.addEventListener("DOMContentLoaded", () => {
  // Global variable to track language status
  let isEnglish = true;

  // --- 1. Language Toggle Logic ---
  const langToggle = document.getElementById("lang-toggle");
  const body = document.body;

  // Function to apply language changes across the page
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
        // Handle placeholder translation for inputs/textareas
        if (element.tagName === "INPUT" || element.tagName === "TEXTAREA") {
          element.setAttribute("placeholder", translation);
        } else {
          element.textContent = translation;
        }
      }
    });
    // Update document title
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

  // --- 2. Smooth Scrolling ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const target = document.querySelector(targetId);

      if (target) {
        const elementPosition = target.getBoundingClientRect().top;
        // Offset to account for fixed header (60px)
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

  // --- 3. 3D STUDIO Submission & Display Logic (WITH LOCAL STORAGE PERSISTENCE) ---
  const modelsContainer = document.getElementById("models-viewer-container");
  const modelForm = document.getElementById("studio3d-upload-form");
  const modelFormMessage = document.getElementById("model-form-message");
  const noModelsMsg = document.getElementById("no-models-msg");

  let submittedModels = [];

  // Function to load data from Local Storage
  const loadModelsFromStorage = () => {
    try {
      const storedModels = localStorage.getItem("bouthaina_3d_models");
      if (storedModels) {
        const loadedModels = JSON.parse(storedModels);
        // Assign a unique ID to any legacy models that are missing one
        submittedModels = loadedModels.map((model) => ({
          ...model,
          id: model.id || Date.now() + Math.random(),
        }));
      }
    } catch (e) {
      console.error("Error loading models from local storage:", e);
      // Optionally clear storage if corrupted data causes continuous errors
      // localStorage.removeItem('bouthaina_3d_models');
    }
  };

  // Function to save data to Local Storage
  const saveModelsToStorage = () => {
    try {
      localStorage.setItem(
        "bouthaina_3d_models",
        JSON.stringify(submittedModels)
      );
    } catch (e) {
      console.error(
        "Error saving models to local storage. File may be too large.",
        e
      );
    }
  };

  // Deletion Logic using Model ID
  const deleteModel = (modelId) => {
    const indexToDelete = submittedModels.findIndex(
      (model) => model.id === modelId
    );

    if (indexToDelete > -1) {
      submittedModels.splice(indexToDelete, 1);
      saveModelsToStorage();
      renderSubmittedModels();
    } else {
      console.error(`Model with ID ${modelId} not found for deletion.`);
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
        const modelSource = model.dataURI;

        const card = document.createElement("div");
        card.className = "model-viewer-card";

        // Check for a valid, non-empty link string
        const hasLink =
          model.link &&
          typeof model.link === "string" &&
          model.link.trim() !== "";

        // Link Button setup
        const linkButtonHtml = hasLink
          ? `<a href="${model.link}" target="_blank" class="link-button" data-en="Download Project" data-ar="تحميل المشروع">Download Project <i class="fas fa-download"></i></a>`
          : `<span class="link-button disabled-link" data-en="Link Not Provided" data-ar="لم يتم تقديم رابط">Link Not Provided</span>`;

        // Deletion button setup
        const delete3DButton = document.createElement("button");
        delete3DButton.className = "button small-button delete-button";
        delete3DButton.setAttribute("data-en", "DELETE");
        delete3DButton.setAttribute("data-ar", "حذف");
        delete3DButton.style.marginLeft = "10px";
        delete3DButton.innerHTML = `<i class="fas fa-trash"></i>`;

        // Use the model's unique ID for reliable deletion
        delete3DButton.onclick = (e) => {
          e.preventDefault();
          deleteModel(model.id);
        };

        const headerContent = document.createElement("div");
        headerContent.style.display = "flex";
        headerContent.style.alignItems = "center";
        headerContent.innerHTML = `<h4 data-en="Model: ${model.title}" data-ar="النموذج: ${model.title}">Model: ${model.title}</h4>`;
        headerContent.appendChild(delete3DButton);

        card.innerHTML = `
                <div class="model-viewer-header">
                    ${headerContent.outerHTML}
                    ${linkButtonHtml}
                </div>
                <div class="model-viewer-container">
                    <model-viewer 
                        src="${modelSource}" 
                        alt="${model.title}" 
                        shadow-intensity="1" 
                        camera-controls 
                        auto-rotate 
                        min-field-of-view="10deg"
                        max-field-of-view="90deg"
                        loading="eager"
                        >
                    </model-viewer>
                </div>
            `;
        modelsContainer.appendChild(card);

        // Re-apply language on new elements
        updateLanguage();
      });
  };

  if (modelForm) {
    modelForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Retrieve elements defensively
      const titleInput = document.getElementById("model-title");
      const fileInput = document.getElementById("model-file");
      const linkInput = document.getElementById("blender-link");

      // --- Critical Check to prevent TypeError ---
      // If the inputs are not found, stop the submission immediately.
      if (!titleInput || !fileInput) {
        console.error(
          "Missing required form elements (model-title or model-file). Check HTML IDs."
        );
        modelFormMessage.textContent = isEnglish
          ? "Internal error: Missing required form fields. Check console."
          : "خطأ داخلي: حقول النموذج المطلوبة مفقودة. تحقق من وحدة التحكم.";
        modelFormMessage.style.color = "red";
        return;
      }

      const title = titleInput.value.trim();
      const file = fileInput.files[0];
      // Safely get the link value, defaulting to an empty string if the input is missing.
      const blenderLink = linkInput ? linkInput.value.trim() : "";

      // Basic validation
      if (!title || !file) {
        modelFormMessage.textContent = isEnglish
          ? "Model title and GLB/GLTF file are required."
          : "عنوان النموذج وملف GLB/GLTF مطلوبان.";
        modelFormMessage.style.color = "red";
        return;
      }
      if (
        !file.name.toLowerCase().endsWith(".glb") &&
        !file.name.toLowerCase().endsWith(".gltf")
      ) {
        modelFormMessage.textContent = isEnglish
          ? "File must be .glb or .gltf format."
          : "يجب أن يكون الملف بتنسيق .glb أو .gltf.";
        modelFormMessage.style.color = "red";
        return;
      }

      const reader = new FileReader();

      reader.onerror = function (err) {
        console.error("FileReader Error:", err);
        modelFormMessage.textContent = isEnglish
          ? "Error reading file. Check file size and format."
          : "خطأ في قراءة الملف. تحقق من حجم الملف وتنسيقه.";
        modelFormMessage.style.color = "red";
      };

      reader.onload = function (event) {
        const dataURI = event.target.result;

        submittedModels.push({
          id: Date.now(),
          title,
          dataURI,
          link: blenderLink,
        });

        saveModelsToStorage();
        renderSubmittedModels();

        modelForm.reset();
        modelFormMessage.textContent = isEnglish
          ? `3D Model "${title}" is now interactive in the studio!`
          : `أصبح النموذج ثلاثي الأبعاد "${title}" تفاعلياً الآن في الاستوديو!`;
        modelFormMessage.style.color = "#4CAF50";
        setTimeout(() => {
          modelFormMessage.textContent = "";
        }, 5000);
      };

      // Check file size limit
      const MAX_SIZE = 8 * 1024 * 1024; // 8MB limit for safety with Local Storage
      if (file.size > MAX_SIZE) {
        modelFormMessage.textContent = isEnglish
          ? "File is too large for local storage (Max 8MB)."
          : "الملف كبير جداً للتخزين المحلي (الحد الأقصى 8 ميجابايت).";
        modelFormMessage.style.color = "red";
        return;
      }

      reader.readAsDataURL(file);
    });
  }

  // Initial calls
  loadModelsFromStorage();
  renderSubmittedModels();
});
