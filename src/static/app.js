document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Clear existing options except the placeholder
      // (so reloading doesn't duplicate options)
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList = details.participants.length > 0
          ? `<div class="participants">
              <h5>Current Participants:</h5>
              <ul>
                ${details.participants.map(email => `<li><span class="participant-email">${email}</span> <button class="unregister-btn" data-activity="${encodeURIComponent(name)}" data-email="${encodeURIComponent(email)}" aria-label="Unregister ${email}">✖</button></li>`).join('')}
              </ul>
            </div>`
          : '<p class="no-participants">No participants yet</p>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          ${participantsList}
        `;

        activitiesList.appendChild(activityCard);

          // Attach click listeners for unregister buttons (delegation could be used but simplest here)
          const unregisterButtons = activityCard.querySelectorAll('.unregister-btn');
          unregisterButtons.forEach(btn => {
            btn.addEventListener('click', async (e) => {
              const activityName = decodeURIComponent(btn.dataset.activity);
              const email = decodeURIComponent(btn.dataset.email);

              try {
                const res = await fetch(`/activities/${encodeURIComponent(activityName)}/participants?email=${encodeURIComponent(email)}`, {
                  method: 'DELETE',
                });

                const json = await res.json();
                if (res.ok) {
                  // Refresh activities list to reflect change
                  fetchActivities();
                } else {
                  console.error('Failed to unregister:', json);
                  alert(json.detail || 'Failed to unregister participant');
                }
              } catch (err) {
                console.error('Error while unregistering:', err);
                alert('Error while unregistering. See console for details.');
              }
            });
          });

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Refresh activities so the newly signed-up participant appears immediately
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
