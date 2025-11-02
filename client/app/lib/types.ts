export interface IProject {
  projectTitle: string;
  projectDescription: string;
  id: string;
  updatedAt: string;
  createdAt: string;
  userId: string;
  inactiveDatabases: string[];
  dbUser: string | null;
  dbName: string | null;
  dbDomain: string | null;
  dbPassword: string | null;
  dbSchema: string | null;
}
