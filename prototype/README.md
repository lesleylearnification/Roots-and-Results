# Roots & Results V18

V18 is a clean rebuild of the two unstable subsystems rather than another patch.

## Structural rules
- The Living System is a fixed-size stage with absolute-positioned game objects.
- Planting cannot participate in document layout or move the stage.
- The bottom action zone is permanent from the beginning of gameplay.
- `state.planted.length` is the single canonical completion source.
- At 6/6 the existing action component transforms into Harvest. Nothing has to appear inside the board.
- Harvest has one event path: READY → TESTING → RESULTS.
- Visual animations never gate progression.

## Built-in release test
Open `index.html?selftest=1`. The test automatically validates:
0/6 through 6/6 planting, unchanged stage geometry after every plant, Harvest availability, Ripple testing feedback, Results transition, and Replay control.
