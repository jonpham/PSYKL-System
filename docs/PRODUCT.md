# PSYKL-System — Product Brief

> Canonical product brief for PSYKL-System. Sits alongside the working agreement in [`AGENTS.md`](../AGENTS.md). When initiatives are planned with `gstack`, they should trace back to the premise, MVP, and constraints described here.

## Premise

A time-independent planning tool for accomplishing and building / expending (PSY) energy in PSYKL (self-defined period or work (minutes)), Earth (day), Moon (month), HelioArc (season/quarter), Sun (year) cycles.

For those who want to build on their accomplishments to best 
suit their own needs by using repetition and energy levels rather than standardized hours and periods.

## Hypothesis

Rather than a simple To-Do list organized by tagging. I want to create a To Do list and backlog that maps to every activity I do all day that requires focus. Rather than a fixed schedule like traditional calendar organizers. I want to do a daily plan that compiles activities ordered based on priority, optimized by location into a daily TO DO list. 

When I want to start a new activity, I select it from the daily task list and it registers a start time and begins a countdown based on a 25 minute pomodoro work cycle. This task is kept in focus until the end of the cycle, or until I mark the task as complete. At the end of the cycle a break of either long or short duration is suggested as another countdown. It continues until the list is complete or I mark the day as "done"

The hypothesis here is that certain individuals suffer from planning paralysis that limits their productivity, or often work in a way that never lines up with traditional organizer plan. This tool is a proposed solution to allow flexible but tracked means of doing focused work.

## Minimum Viable Product

- Able to make a backlog of tasks
- Able to trigger a daily plan on first pickup & open of the day.
- Able to make a daily plan from backlog of tasks
- Able to execute on tasks in user-defined PSYKL cycles (default: a 25-minute pomodoro).

## Future features
- Recurring Tasks prevent daily/regular recreation of similar tasks
- Daily Goals; a set of recurring tasks that should happen every day
- Expand tasks beyond description with:
    - tags of multiple types (location, priority, requirement, category, project)
    - total time estimations
    - Task dependencies
    - Notes / References (URLs) / Photos
- Map Completed tasks to a daily summary and reverse create a calendar of actual activity.
- Task estimator based on previously completed tasks
- Add daily journal for end of day retrospective
- Analytics of task trends
- Sync task calendar to iCloud or Google Calendar
- Export Calendar and Journals to Day-based Markdown Files, Downloadable as ZIP archives or automatically backed up to local Filesystem.
- Import tasks from Apple Reminders , mark Apple Reminders completed, move, or rename, or Sync
- Apple Watch integration to detect movement to pause or distraction.

## Surface Areas (Clients)
- Browser/Web Progressive Web Application (PWA) Client
- iPad App Apple iOS 
- iPhone App Apple iOS 
- Mac OS App Apple

## Engineering Constraints
- All software changes should be made in a single Monorepo
- Software system components should be subtree repositories that are pushed to individually to act as standalone archives.
- The monorepo will host shared packages, E2E System Tests, infrastructure deployment, local system (docker-compose)deployments, and documentation.
- All subcomponents should have Unit, Code-Integration, Component Tests. i.e. for a Web App Vitest Unit Tests and Code-Integration Tests, Storybook Integration Tests, and Stubbed E2E Playwright Tests that run against a containerized application (if possible).
- Self Hosted (Docker Compose) Deployment with in-process database as necessary
- Build accordingly with the ability to scale to a hundred thousand concurrent users in a production environment.

## Staging Environments
- Local : Deploy application processes on host
- Docker : Deploy applications as Docker Compose cluster on host
- Staging: GitOps CI/CD Pipeline publishes docker images and pushes helm charts for Argo CD to deploy on self-hosted kubernetes cluster
- Production: A deploy to public Platform as a Service onto Pulumi IaC orchestrated infrastructure. release tags only.
