from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from models import Project, User, UserProjectAccess
from postgres import SessionLocal


def list_team_members(organization_id: str) -> list[dict]:
    with SessionLocal() as session:
        users = session.execute(
            select(User).where(User.organization_id == organization_id).order_by(User.role.asc(), User.email.asc())
        ).scalars().all()
        access_rows = session.execute(
            select(UserProjectAccess.user_id, Project.name)
            .join(Project, Project.id == UserProjectAccess.project_id)
            .order_by(Project.name.asc())
        ).all()
        projects_by_user: dict[str, list[str]] = {}
        for user_id, project_name in access_rows:
            projects_by_user.setdefault(user_id, []).append(project_name)

        return [
            {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "role": user.role,
                "projects": projects_by_user.get(user.id, []),
                "project_ids": session.execute(
                    select(UserProjectAccess.project_id).where(UserProjectAccess.user_id == user.id)
                ).scalars().all(),
            }
            for user in users
        ]


def get_user_project_names(user: dict) -> list[str]:
    if user.get("role") == "admin":
        with SessionLocal() as session:
            return session.execute(
                select(Project.name)
                .where(Project.organization_id == user.get("org_id"))
                .order_by(Project.name.asc())
            ).scalars().all()
    return user.get("project_names", [])


def user_can_access_project(user: dict, project_name: str | None) -> bool:
    if not project_name:
        return True
    if user.get("role") == "admin":
        return True
    return project_name in get_user_project_names(user)
