# EndovisML

![overview screenshot](assets/overview.gif)

EndovisML is a data visualization tool that allows interactive exploration of dataset splits for surgical phase and instrument recognition. In particular, this application focuses on the visualization of distributions of phases, phase transitions, instruments, and instrument combinations. Due to the complex nature and the heterogeneity of surgeries, surgical workflow datasets are often inherently imbalanced. When splitting imbalanced datasets into training, validation, and test sets, some classes may not be sufficiently represented in one of the splits which may lead to misleading performance evaluation results. With the help of this application, the user can visualize a chosen dataset split and identify potential issues, e.g., a class not being represented in one of the sets. To use this application the user needs to upload phase and instrument annotations in CSV format as well as define dataset splits.

## Loading of datasets
A special feature of this application is the ability to load custom datasets into the application for further exploration and analysis. To do this, the user needs to upload phase and instrument annotation files in CSV format. The software does not require video data or video frames. Filenames of phase and instrument annotations should be structured as follows:

- Integer number that uniquely identifies a surgery (henceforth referred to as *surgery ID*)
- Suffix part that distinguishes phase annotation files from instrument annotation files (e.g., `phase` for phase and `inst` for instrument annotation files)

Examples of valid filenames: `video10_phase.csv`, `video10_inst.csv`.

Note that the software currently supports only one-to-one mapping of phase and instrument annotation files. Furthermore, the application expects both phase and instrument annotations for each surgery. Consequently, a surgery is comprised of a single phase annotation file and a single instrument annotation file.

### Phase annotation files
Phase annotation files should be formatted according to the following rules: 

- Contain two columns for frame numbers and the corresponding phases
- Phases are encoded as integers starting from 0
- Contain a header row `Frame,Phase` (case sensitive)
- Frame numbers should be continuous and without gaps

See the example of a phase annotation file below.

```CSV
Frame,Phase
0,0
1,0
2,0
3,0
4,0
5,0
6,0
7,0
8,0
9,0
10,0
11,0
...
```

### Instrument annotation files
Instrument annotation files should be formatted according to the following rules:

- Contain one column for frame numbers and one column for each instrument
- Instrument usage is encoded using binary values (i.e., 1 means instrument is used; 0 means instrument is not used)
- Contain a header row `Frame,...` (case sensitive)

See the example of an instrument annotation file below.

```CSV
Frame,Grasper,Bipolar,Hook,Scissors,Clipper,Irrigator,SpecimenBag
0,1,0,0,0,0,0,0
25,0,1,0,0,0,0,0
50,1,0,0,0,0,0,0
75,0,0,0,0,0,0,0
100,0,0,0,0,0,0,0
125,0,0,0,0,0,0,0
150,1,0,0,0,0,0,0
175,0,0,0,0,0,0,0
200,0,0,0,1,0,0,0
225,0,0,0,0,0,0,0
250,1,0,0,0,0,0,0
275,0,0,0,0,0,0,0
...
```

### Configuration file (optional)
To avoid configuring the application on every page reload, the user may provide a JSON file containing all configuration parameters. The configuration file should contain the following attributes:

- `delimiter`: CSV-delimiter used in the phase and instrument annotation files. This attribute may hold the following values (case-sensitive):
    - `comma`: The values are comma-separated
    - `tab`: The values are tab-separated
    - `semicolon`: The values are semicolon-separated
- `phaseId`: Suffix part of filenames that is specific for phase annotation files (e.g., `phase` in `video10_phase.csv`)
- `instId`: Suffix part of filenames that is specific for instrument annotation files (e.g., `inst` in `video10_inst.csv`)
- `phaseLabels`: List of phase labels (ordered)
- `instLabels`: List of instrument labels
- `crossValSplits`: A list of surgery IDs for cross-validation splits
- `testSplit`: List of surgery IDs for the holdout test set

See the example configuration file below.

```JSON
{
  "delimiter": "comma",
  "phaseId": "phase",
  "instId": "tool",
  "phaseLabels": [
    "Preparation",
    "Calot triangle dissection",
    "Clipping cutting",
    "Gallbladder dissection",
    "Gallbladder packaging",
    "Cleaning coagulation",
    "Gallbladder retraction"
  ],
  "instLabels": [
    "Grasper",
    "Bipolar",
    "Hook",
    "Scissors",
    "Clipper",
    "Irrigator",
    "SpecimenBag"
  ],
  "crossValSplits": [
    {
      "train": [1, 2, 3, 4, 5, 6],
      "validation": [7, 8]
    }
  ],
  "testSplit": [9, 10]
}
```

## Citation
This work was presented at the [14th International Conference on Information Processing in Computer-Assisted Interventions (IPCAI 2023)](https://www.ipcai.org/home) as a long abstract. Publication preprint is available at [arXiv](https://doi.org/10.48550/arXiv.2306.16879). Please cite this work if you use the code in your own work.

```BibTeX
@misc{Kostiuchik2023,
      title={Surgical Phase and Instrument Recognition: How to identify appropriate Dataset Splits}, 
      author={Georgii Kostiuchik and Lalith Sharan and Benedikt Mayer and Ivo Wolf and Bernhard Preim and Sandy Engelhardt},
      year={2023},
      eprint={2306.16879},
      archivePrefix={arXiv},
      primaryClass={cs.LG}
}
```

## Contact information
We are actively working on improving the software and the user experience. If you have any comments, questions, or feature requests, send us an [E-Mail](mailto:georgii.kostiuchik@med.uni-heidelberg.de) or create an [issue](https://github.com/Cardio-AI/endovis-ml/issues/new) in this repository.
