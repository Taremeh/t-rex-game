# Instructions

The goal of this experiment is to customize the Google Chrome T-Rex Game according to the tasks below.

![GOAL](./demo.gif)

## Tasks

Information before starting:
- You will have up to **45min** time to work on these three tasks. 
- Complete the tasks in chronological order (i.e., task 1, task 2, task 3).
- Most if not all code changes can be made in the game runner file ([/src/runner.ts)](/src/runner.ts))
- Do not skip tasks before completing them.
- Do not resize or move the windows during the experiment.
- You might need to reload the game preview after making changes.

You are allowed to use:

✅ All IDE functionality that is enabled (including code suggestions). <br/>
✅ Web Searches, Documentations, StackOverflow etc.

You are **not allowed** to use the following:

❌ Do not use external generative AI tools (e.g., ChatGPT) <br/>
❌ Do not use CoPilot Chat


Finally: Do not worry if you can not complete all tasks! Good luck 😀

---

### Task 1: Speed Control

Implement the ability to increase and decrease the speed of the t-rex by using the left and right arrows ← →.


Definitions of Done:

- You can increase the speed of the t-rex by pressing the right arrow (→) and decrease the speed by pressing the left arrow (←).

Hints:
- You can find and add the key press definitions in [/src/runner.ts (L53)](/src/runner.ts#L53)
- Do not confuse the `KEYDOWN` event and `onKeyDown` function with pressing the down arrow key ↓. It **does not** refer to the down arrow key, but to the event of any key being pressed down!

---

### Task 2: Life System

Implement a system where the T-Rex has three lives, allowing it to continue after hitting obstacles as long as there is at least one life left. Display the life counter as a number next to the distance meter (top right corner).

Definitions of Done:

- Game starts with 3 lives, displaying the counter in the top-right corner.
- After a collision with an obstacle deduct 1 life.
- Show the GameOver screen, if no lives (i.e., 0 lives) remain.

Hints: 
- After a collision, you might need to set a grace period or move the obstacle, such that the player does not get hit again instantly in the next frame.
- For rendering the remaining lives, you can use the [`lifeCounter`](./src/lifeCounter.ts) component and its [`lifeCounter.update()`](./src/lifeCounter.ts#L58) function. The component behaves similarly to the [`distanceMeter`](./src/distanceMeter.ts) component.

---

### Task 3: Customize Sharing Achievement

Currently, a share button appears below the game canvas after the game is over. By clicking the button, the current HTML canvas gets downloaded as an image. Customize this share function, such that users can add their name to the image, before downloading it. Most if not all changes can directly be made in the [SharePanel](./src/sharePanel.ts) component.

Definitions of Done:

- By clicking the _Share_ button, the user is prompted to enter a name.
- After submitting the name, a download of the sharable image is triggered. The image should contain the user name, achieved distance, and use the last frame as the background image.


The final image could look like this:
![img](./task_3_example.png)