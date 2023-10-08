import * as shell from "shelljs";

shell.mkdir("-p", "dist");
shell.cp("-R", "src/nodes/*.html", "dist/nodes/");
