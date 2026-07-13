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

      // Clear loading message and reset activity select options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list as DOM elements (so we can attach delete handlers)
        const participants = details.participants || [];

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        const participantsDiv = document.createElement('div');
        participantsDiv.className = 'participants';
        const strong = document.createElement('strong');
        strong.textContent = 'Participants:';
        participantsDiv.appendChild(strong);

        if (participants.length) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.textContent = p;

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-btn';
            removeBtn.title = 'Remove participant';
            removeBtn.textContent = '✖';

            // Attach handler to unregister participant
            removeBtn.addEventListener('click', async () => {
              // optimistic UI: disable button while processing
              removeBtn.disabled = true;
              try {
                const resp = await fetch(`/activities/${encodeURIComponent(name)}/unregister?email=${encodeURIComponent(p)}`, {
                  method: 'POST',
                });
                const resJson = await resp.json();
                if (resp.ok) {
                  // Refresh activities to reflect change
                  await fetchActivities();
                  // show brief success message
                  messageDiv.textContent = resJson.message;
                  messageDiv.className = 'message success';
                  messageDiv.classList.remove('hidden');
                  setTimeout(() => messageDiv.classList.add('hidden'), 3000);
                } else {
                  messageDiv.textContent = resJson.detail || 'Failed to remove participant';
                  messageDiv.className = 'message error';
                  messageDiv.classList.remove('hidden');
                  removeBtn.disabled = false;
                }
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
                removeBtn.disabled = false;
              }
            });

            li.appendChild(span);
            li.appendChild(removeBtn);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const pNo = document.createElement('p');
          pNo.className = 'no-participants';
          pNo.textContent = 'No participants yet';
          participantsDiv.appendChild(pNo);
        }

        activityCard.appendChild(participantsDiv);

        activitiesList.appendChild(activityCard);

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
        messageDiv.className = "message success";
        signupForm.reset();

        // Refresh the activities list so participants update immediately
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
